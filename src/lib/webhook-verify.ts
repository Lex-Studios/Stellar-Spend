/**
 * Public barrel for the webhook-verify module (#1539).
 *
 * Canonical import path: `@/lib/webhook-verify`
 *
 * The implementation lives in `webhookVerify.ts` (camelCase) for historical
 * reasons; this file is the kebab-case alias that callers should use.
 * The old camelCase name is kept as a deprecated re-export shim.
 */
export * from './webhookVerify';
