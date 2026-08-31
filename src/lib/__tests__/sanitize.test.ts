/**
 * Unit tests for sanitizeMemo — issue #1047.
 *
 * Acceptance criteria: XSS payload test passes safely.
 *
 * Strategy:
 *  - Verify script tags and common XSS vectors are stripped.
 *  - Verify legitimate plain text is preserved unchanged.
 *  - Verify the 500-char cap is enforced.
 *  - Verify edge cases (empty, whitespace, entities).
 */
import { describe, it, expect } from 'vitest';
import { sanitizeMemo, MEMO_MAX_LENGTH } from '../sanitize';

describe('sanitizeMemo', () => {
  // -----------------------------------------------------------------------
  // XSS payload rejection
  // -----------------------------------------------------------------------
  describe('XSS vectors', () => {
    it('strips <script> tags entirely', () => {
      const input = '<script>alert("XSS")</script>';
      expect(sanitizeMemo(input)).toBe('');
    });

    it('strips inline event handlers', () => {
      const input = '<img src=x onerror="alert(1)">';
      expect(sanitizeMemo(input)).toBe('');
    });

    it('strips javascript: URI scheme in anchor tags', () => {
      const input = '<a href="javascript:void(0)">click me</a>';
      // Tag stripped, but text content is preserved (KEEP_CONTENT: true)
      expect(sanitizeMemo(input)).not.toContain('<a');
      expect(sanitizeMemo(input)).not.toContain('javascript:');
    });

    it('strips <iframe> embed vectors', () => {
      const input = '<iframe src="https://evil.example.com"></iframe>';
      expect(sanitizeMemo(input)).toBe('');
    });

    it('strips <svg> with embedded onload handler', () => {
      const input = '<svg onload="alert(1)"></svg>';
      expect(sanitizeMemo(input)).toBe('');
    });

    it('strips HTML comments containing payloads', () => {
      const input = '<!--<script>alert(1)</script>-->normal text';
      const result = sanitizeMemo(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert(1)');
    });

    it('strips data: URI from img tags', () => {
      const input = '<img src="data:text/html,<script>alert(1)</script>">';
      expect(sanitizeMemo(input)).toBe('');
    });

    it('strips style tags with expression payloads', () => {
      const input = '<style>body{background:url(javascript:alert(1))}</style>';
      expect(sanitizeMemo(input)).toBe('');
    });

    it('handles nested tags — full script wrapped in bold', () => {
      const input = '<b><script>alert(1)</script></b>';
      expect(sanitizeMemo(input)).toBe('');
    });

    it('handles encoded script tag variants', () => {
      // DOMPurify decodes HTML entities before sanitizing
      const input = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const result = sanitizeMemo(input);
      // Decoded to plain text — should NOT contain executable script tags
      expect(result).not.toContain('<script>');
    });
  });

  // -----------------------------------------------------------------------
  // Legitimate plain-text is preserved
  // -----------------------------------------------------------------------
  describe('legitimate input', () => {
    it('preserves plain text without modification', () => {
      expect(sanitizeMemo('Transfer to savings account')).toBe('Transfer to savings account');
    });

    it('preserves numbers and punctuation', () => {
      expect(sanitizeMemo('Invoice #12345 - $100.00')).toBe('Invoice #12345 - $100.00');
    });

    it('preserves unicode characters', () => {
      expect(sanitizeMemo('Rent payment — flat 3B')).toBe('Rent payment — flat 3B');
    });

    it('preserves emojis', () => {
      expect(sanitizeMemo('Lunch 🍜')).toBe('Lunch 🍜');
    });

    it('trims leading and trailing whitespace', () => {
      expect(sanitizeMemo('  hello  ')).toBe('hello');
    });
  });

  // -----------------------------------------------------------------------
  // Length cap
  // -----------------------------------------------------------------------
  describe('length enforcement', () => {
    it('returns strings at exactly MEMO_MAX_LENGTH unchanged', () => {
      const atLimit = 'a'.repeat(MEMO_MAX_LENGTH);
      expect(sanitizeMemo(atLimit)).toBe(atLimit);
    });

    it('truncates strings exceeding MEMO_MAX_LENGTH', () => {
      const overLimit = 'b'.repeat(MEMO_MAX_LENGTH + 100);
      const result = sanitizeMemo(overLimit);
      expect(result.length).toBe(MEMO_MAX_LENGTH);
    });

    it('does not pad strings shorter than MEMO_MAX_LENGTH', () => {
      const short = 'short note';
      expect(sanitizeMemo(short).length).toBe(short.length);
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      expect(sanitizeMemo('')).toBe('');
    });

    it('returns empty string for whitespace-only input', () => {
      expect(sanitizeMemo('   ')).toBe('');
    });

    it('handles very long XSS payload without throwing', () => {
      const input = '<script>alert(1)</script>'.repeat(100);
      expect(() => sanitizeMemo(input)).not.toThrow();
      expect(sanitizeMemo(input)).toBe('');
    });
  });
});
