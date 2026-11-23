/**
 * Public barrel for the rate-limiter module (#1539).
 *
 * Canonical import path: `@/lib/rate-limiter`
 *
 * The implementation lives in `rateLimiter.ts` (camelCase) for historical
 * reasons; this file is the kebab-case alias that callers should use.
 * The old camelCase name is kept as a deprecated re-export shim to avoid
 * breaking existing imports — update them to this path over time.
 */
export * from './rateLimiter';
