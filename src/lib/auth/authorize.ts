import type { NextRequest } from 'next/server';

/**
 * Shared request authorization helpers. Every route that reads credentials
 * from headers goes through these so Bearer parsing lives in one place.
 */

const BEARER_PATTERN = /^Bearer\s+(.+)$/i;

/** Extract the token from an `Authorization: Bearer <token>` header value. */
export function extractBearerToken(authorization: string | null | undefined): string | null {
  if (!authorization) return null;
  return authorization.match(BEARER_PATTERN)?.[1] ?? null;
}

/** Extract an API key from `x-api-key`, falling back to a Bearer token. */
export function extractApiKeyFromRequest(request: NextRequest): string | null {
  const xApiKey = request.headers.get('x-api-key');
  if (xApiKey) return xApiKey;
  return extractBearerToken(request.headers.get('authorization'));
}

/** Extract the Bearer token from a request's `Authorization` header. */
export function extractRequestBearerToken(request: NextRequest): string | null {
  return extractBearerToken(request.headers.get('authorization'));
}
