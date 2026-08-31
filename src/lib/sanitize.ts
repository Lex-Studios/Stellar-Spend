/**
 * Client-side input sanitization utilities.
 *
 * Uses isomorphic-dompurify so the same logic runs in both browser and
 * server/test environments (DOMPurify needs a DOM; isomorphic-dompurify
 * provides a jsdom fallback when window is unavailable).
 *
 * All memo/note fields that accept free text from the user MUST pass through
 * sanitizeMemo() before being stored or displayed.  React's JSX escaping
 * protects rendered text nodes, but this guard also strips payloads from
 * plain-text contexts such as aria-label, title, clipboard, and the backend
 * API so that stored data is never a latent XSS vector.
 */
import DOMPurify from 'isomorphic-dompurify';

/**
 * Maximum character length for a transaction memo/note.
 * This mirrors the 500-char backend constraint.
 */
export const MEMO_MAX_LENGTH = 500;

/**
 * Sanitize a user-supplied memo or note field.
 *
 * - Strips all HTML tags and attributes (ALLOWED_TAGS: []).
 * - Removes dangerous URI schemes (javascript:, data:, etc.).
 * - Trims to MEMO_MAX_LENGTH characters.
 *
 * Returns a plain-text string that is safe to use in JSX, as an aria-label,
 * as a title attribute, or when persisted to storage.
 *
 * @param input - Raw user input (may contain HTML / script payloads).
 * @returns Sanitized plain-text string.
 */
export function sanitizeMemo(input: string): string {
  // DOMPurify.sanitize with ALLOWED_TAGS=[] strips all HTML and
  // resolves HTML entities to their text equivalents.
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  return clean.trim().slice(0, MEMO_MAX_LENGTH);
}
