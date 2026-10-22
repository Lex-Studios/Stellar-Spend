/**
 * Crypto-safe ID generation (#1371).
 *
 * Replaces `Math.random().toString(36).slice(2, N)` ID patterns, which are
 * predictable and unsuitable for identifiers, tokens, request IDs, or any
 * value that ends up in URLs, DBs, or external payloads.
 *
 * Uses Web Crypto (`crypto.getRandomValues`), available in Node.js 19+,
 * browsers, and the Next.js Edge runtime.
 */

const HEX_ALPHABET = '0123456789abcdef';

/** Return `byteLength` secure random bytes as a lowercase hex string of length `2*byteLength`. */
export function randomHex(byteLength: number): string {
  if (byteLength <= 0 || !Number.isInteger(byteLength)) {
    throw new Error(`randomHex: byteLength must be a positive integer, got ${byteLength}`);
  }
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    out += HEX_ALPHABET[b >> 4] + HEX_ALPHABET[b & 0x0f];
  }
  return out;
}

/** Uppercase-hex variant for display IDs (CLAIM-, PAY-, REV-). */
export function randomHexUpper(byteLength: number): string {
  return randomHex(byteLength).toUpperCase();
}

/** Full UUID v4 via `crypto.randomUUID`. */
export function randomUuid(): string {
  return crypto.randomUUID();
}
