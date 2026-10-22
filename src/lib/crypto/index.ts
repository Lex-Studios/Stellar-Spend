/**
 * Crypto primitives (#1205, #1371).
 *
 * - `signature` — HMAC sign / verify / safeCompare (sync Node + async Web Crypto)
 * - `ids`       — crypto-safe ID generation to replace Math.random patterns
 */
export * from './signature';
export * from './ids';
