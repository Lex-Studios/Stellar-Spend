/**
 * Shared admin authorization guard for all `/api/admin/*` routes.
 *
 * Usage:
 *   import { requireAdmin } from '@/lib/auth/require-admin';
 *
 *   export async function GET(request: NextRequest) {
 *     const unauthorized = requireAdmin(request);
 *     if (unauthorized) return unauthorized;
 *     // ... handler logic
 *   }
 *
 * The guard checks the `Authorization: Bearer <token>` header against the
 * configured `API_KEY_ADMIN_TOKEN` environment variable.  It returns:
 *   - `null`             when the caller is authorized (proceed normally)
 *   - `NextResponse`     when the caller is NOT authorized (return immediately)
 */

import { NextRequest } from 'next/server';
import { ErrorHandler } from '@/lib/error-handler';
import { hasApiKeyAdminToken, isValidAdminToken } from '@/lib/api-keys/service';

/**
 * Validate that the incoming request carries a valid admin bearer token.
 *
 * @returns `null` if authorized; a `NextResponse` (403/500) if not.
 */
export function requireAdmin(request: NextRequest) {
  // Guard against misconfigured deployments — fail closed.
  if (!hasApiKeyAdminToken()) {
    return ErrorHandler.serverError(new Error('Admin token is not configured'));
  }

  const authorization = request.headers.get('authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;

  if (!isValidAdminToken(token)) {
    return ErrorHandler.forbidden('Admin access required');
  }

  return null;
}
