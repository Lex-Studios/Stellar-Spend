/**
 * Single shared router for IP-whitelist operations.
 *
 * Admin and security routes both mount this factory — they differ only in
 * the capabilities granted to the caller. Business logic lives in
 * `lib/ip-whitelist.ts`; this file is the HTTP layer.
 */
import { Router, Request, Response, NextFunction } from 'express';
import {
  listEntries,
  getEntry,
  addEntry,
  removeEntry,
  updateEntry,
  IpWhitelistError,
} from '../../lib/ip-whitelist';

export type IpWhitelistRole = 'admin' | 'security';

export interface IpWhitelistRouterOptions {
  /** Which capability set the caller for this router gets. */
  role: IpWhitelistRole;
  /** Middleware that authenticates and attaches the caller. Must set req.auth. */
  auth: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * Capability matrix — the ONE place that encodes the admin/security distinction.
 */
const CAPABILITIES: Record<IpWhitelistRole, {
  list: boolean;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}> = {
  admin:    { list: true,  read: true,  create: true,  update: true,  delete: true  },
  security: { list: true,  read: true,  create: false, update: false, delete: false },
};

function requireCapability(
  role: IpWhitelistRole,
  action: keyof typeof CAPABILITIES['admin'],
) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (!CAPABILITIES[role][action]) {
      return res.status(403).json({
        error: 'forbidden',
        message: `Role '${role}' cannot perform '${action}' on IP whitelist`,
      });
    }
    next();
  };
}

function handleError(err: unknown, res: Response) {
  if (err instanceof IpWhitelistError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  // eslint-disable-next-line no-console -- server-side error logging
  console.error('ip-whitelist error:', err);
  return res.status(500).json({ error: 'internal_error' });
}

export function buildIpWhitelistRouter(options: IpWhitelistRouterOptions): Router {
  const { role, auth } = options;
  const router = Router();

  // All routes require authentication
  router.use(auth);

  // ─── List ─────────────────────────────────────────────────────
  router.get(
    '/',
    requireCapability(role, 'list'),
    async (_req: Request, res: Response) => {
      try {
        const entries = await listEntries();
        res.json({ entries });
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // ─── Read one ─────────────────────────────────────────────────
  router.get(
    '/:id',
    requireCapability(role, 'read'),
    async (req: Request, res: Response) => {
      try {
        const entry = await getEntry(req.params.id);
        if (!entry) return res.status(404).json({ error: 'not_found' });
        res.json({ entry });
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // ─── Create ───────────────────────────────────────────────────
  router.post(
    '/',
    requireCapability(role, 'create'),
    async (req: Request, res: Response) => {
      try {
        const { cidr, label, expiresAt } = req.body ?? {};
        const entry = await addEntry({ cidr, label, expiresAt });
        res.status(201).json({ entry });
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // ─── Update ───────────────────────────────────────────────────
  router.patch(
    '/:id',
    requireCapability(role, 'update'),
    async (req: Request, res: Response) => {
      try {
        const entry = await updateEntry(req.params.id, req.body ?? {});
        res.json({ entry });
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // ─── Delete ───────────────────────────────────────────────────
  router.delete(
    '/:id',
    requireCapability(role, 'delete'),
    async (req: Request, res: Response) => {
      try {
        await removeEntry(req.params.id);
        res.status(204).send();
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  return router;
}
