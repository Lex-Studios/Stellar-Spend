/**
 * Tests for the shared IP-whitelist router.
 * Verifies both admin and security capability paths against one implementation.
 */
import express from 'express';
import request from 'supertest';
import { buildIpWhitelistRouter } from '../ip-whitelist.router';

// ─── Mock the lib module ──────────────────────────────────────────
jest.mock('../../../lib/ip-whitelist', () => ({
  IpWhitelistError: class IpWhitelistError extends Error {
    status: number;
    code: string;
    constructor(code: string, message: string, status = 400) {
      super(message);
      this.code = code;
      this.status = status;
    }
  },
  listEntries: jest.fn(),
  getEntry: jest.fn(),
  addEntry: jest.fn(),
  updateEntry: jest.fn(),
  removeEntry: jest.fn(),
}));

import * as lib from '../../../lib/ip-whitelist';
const mocked = lib as jest.Mocked<typeof lib>;

const noopAuth = (_req: any, _res: any, next: any) => next();

function makeApp(role: 'admin' | 'security') {
  const app = express();
  app.use(express.json());
  app.use('/whitelist', buildIpWhitelistRouter({ role, auth: noopAuth }));
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Admin path ───────────────────────────────────────────────────
describe('admin role', () => {
  const app = makeApp('admin');

  it('GET / returns list', async () => {
    mocked.listEntries.mockResolvedValue([{ id: '1', cidr: '10.0.0.0/8' }] as any);
    const res = await request(app).get('/whitelist');
    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(1);
  });

  it('POST / creates an entry', async () => {
    mocked.addEntry.mockResolvedValue({ id: '2', cidr: '10.1.0.0/16' } as any);
    const res = await request(app)
      .post('/whitelist')
      .send({ cidr: '10.1.0.0/16', label: 'office' });
    expect(res.status).toBe(201);
    expect(res.body.entry.id).toBe('2');
  });

  it('PATCH /:id updates an entry', async () => {
    mocked.updateEntry.mockResolvedValue({ id: '2', label: 'renamed' } as any);
    const res = await request(app).patch('/whitelist/2').send({ label: 'renamed' });
    expect(res.status).toBe(200);
  });

  it('DELETE /:id removes an entry', async () => {
    mocked.removeEntry.mockResolvedValue(undefined);
    const res = await request(app).delete('/whitelist/2');
    expect(res.status).toBe(204);
  });
});

// ─── Security path ────────────────────────────────────────────────
describe('security role', () => {
  const app = makeApp('security');

  it('GET / returns list (allowed)', async () => {
    mocked.listEntries.mockResolvedValue([]);
    const res = await request(app).get('/whitelist');
    expect(res.status).toBe(200);
  });

  it('GET /:id returns one (allowed)', async () => {
    mocked.getEntry.mockResolvedValue({ id: '1' } as any);
    const res = await request(app).get('/whitelist/1');
    expect(res.status).toBe(200);
  });

  it('POST / is forbidden', async () => {
    const res = await request(app).post('/whitelist').send({ cidr: '10.0.0.0/8' });
    expect(res.status).toBe(403);
    expect(mocked.addEntry).not.toHaveBeenCalled();
  });

  it('PATCH /:id is forbidden', async () => {
    const res = await request(app).patch('/whitelist/1').send({ label: 'x' });
    expect(res.status).toBe(403);
    expect(mocked.updateEntry).not.toHaveBeenCalled();
  });

  it('DELETE /:id is forbidden', async () => {
    const res = await request(app).delete('/whitelist/1');
    expect(res.status).toBe(403);
    expect(mocked.removeEntry).not.toHaveBeenCalled();
  });
});

// ─── Error mapping ────────────────────────────────────────────────
describe('error handling', () => {
  const app = makeApp('admin');

  it('maps IpWhitelistError to its status/code', async () => {
    const err = new (lib.IpWhitelistError as any)('invalid_cidr', 'bad cidr', 422);
    mocked.addEntry.mockRejectedValue(err);
    const res = await request(app).post('/whitelist').send({ cidr: 'nope' });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('invalid_cidr');
  });

  it('maps unknown errors to 500', async () => {
    mocked.listEntries.mockRejectedValue(new Error('boom'));
    const res = await request(app).get('/whitelist');
    expect(res.status).toBe(500);
  });
});
