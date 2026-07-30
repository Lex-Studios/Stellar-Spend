/**
 * CORS configuration for API routes.
 *
 * In production, only origins listed in ALLOWED_ORIGINS (comma-separated env var)
 * are permitted. In development, localhost origins are allowed by default.
 */

const DEFAULT_DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];

/**
 * Returns the set of allowed origins based on the current environment.
 */
export function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS;
  if (raw && raw.trim().length > 0) {
    return raw
      .split(",")
      .map((o: string) => o.trim())
      .filter(Boolean);
  }
  // Fall back to dev origins when no explicit list is configured
  return DEFAULT_DEV_ORIGINS;
}

/**
 * Resolves the Access-Control-Allow-Origin value for a given request origin.
 * Returns the origin if it is in the allowed list, otherwise null.
 */
export function resolveOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;
  const allowed = getAllowedOrigins();
  return allowed.includes(requestOrigin) ? requestOrigin : null;
}

/** Headers sent on every CORS response (preflight + actual). */
export const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id",
  "Access-Control-Max-Age": "86400", // 24 h preflight cache
} as const;
