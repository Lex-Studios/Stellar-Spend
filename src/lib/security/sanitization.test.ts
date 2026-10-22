import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  escapeSql,
  escapeNoSql,
  escapeShell,
  sanitizeUrl,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeObjectKeys,
  sanitizeJson,
  sanitizeStellarAddress,
  sanitizeBlockchainAddress,
} from './sanitization';

describe('Input Sanitization', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      expect(sanitizeHtml(input)).not.toContain('script');
    });

    it('should remove event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      expect(sanitizeHtml(input)).not.toContain('onerror');
    });

    it('should handle non-string input', () => {
      expect(sanitizeHtml(null as unknown as string)).toBe('');
      expect(sanitizeHtml(undefined as unknown as string)).toBe('');
    });

    describe('XSS payloads', () => {
      it.each([
        ['javascript: URI in anchor', '<a href="javascript:alert(1)">x</a>'],
        ['svg onload', '<svg onload="alert(1)"></svg>'],
        ['iframe srcdoc', '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
        ['body onload', '<body onload="alert(1)">'],
        ['mixed-case script tag', '<ScRiPt>alert(1)</ScRiPt>'],
        ['img onerror with entity-encoded payload', '<img src=x onerror="&#97;lert(1)">'],
      ])('strips executable content: %s', (_label, payload) => {
        const output = sanitizeHtml(payload);
        expect(output.toLowerCase()).not.toContain('javascript:');
        expect(output.toLowerCase()).not.toMatch(/<script/);
        expect(output.toLowerCase()).not.toMatch(/\son\w+=/);
        expect(output.toLowerCase()).not.toContain('<iframe');
      });

      it('returns no markup when ALLOWED_TAGS is empty', () => {
        expect(sanitizeHtml('<b>bold</b> and <i>italic</i>')).toBe('bold and italic');
      });

      it('keeps plain text content intact', () => {
        expect(sanitizeHtml('Send 10 USDC to Alice')).toBe('Send 10 USDC to Alice');
      });
    });
  });

  describe('escapeSql', () => {
    it('should escape single quotes', () => {
      expect(escapeSql("O'Reilly")).toBe("O''Reilly");
    });

    it('should escape backslashes', () => {
      expect(escapeSql('back\\slash')).toBe('back\\\\slash');
    });

    it('should escape null bytes', () => {
      expect(escapeSql('null\0byte')).toBe('null\\0byte');
    });
  });

  describe('escapeNoSql', () => {
    it('should escape dollar signs', () => {
      expect(escapeNoSql('$where')).toBe('\\$where');
    });

    it('should escape dots in strings', () => {
      expect(escapeNoSql('user.name')).toBe('user\\.name');
    });

    it('should recursively escape object keys', () => {
      const input = { $set: { 'user.name': 'value' } };
      const result = escapeNoSql(input) as Record<string, unknown>;
      expect(Object.keys(result)[0]).toBe('\\$set');
    });

    it('should handle arrays', () => {
      const input = ['$where', 'user.name'];
      const result = escapeNoSql(input) as string[];
      expect(result[0]).toBe('\\$where');
      expect(result[1]).toBe('user\\.name');
    });
  });

  describe('escapeShell', () => {
    it('should wrap in single quotes', () => {
      expect(escapeShell('test')).toBe("'test'");
    });

    it('should escape single quotes', () => {
      expect(escapeShell("it's")).toBe("'it'\\''s'");
    });
  });

  describe('sanitizeUrl', () => {
    it('should accept valid https URLs', () => {
      const url = 'https://example.com/path';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should accept valid http URLs', () => {
      const url = 'http://example.com/path';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should reject javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('should reject data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should handle invalid URLs', () => {
      expect(sanitizeUrl('not a url')).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should accept valid emails', () => {
      expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
    });

    it('should lowercase emails', () => {
      expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
    });

    it('should reject invalid emails', () => {
      expect(sanitizeEmail('not-an-email')).toBe('');
      expect(sanitizeEmail('user@')).toBe('');
      expect(sanitizeEmail('@example.com')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
    });
  });

  describe('sanitizeNumber', () => {
    it('should accept valid numbers', () => {
      expect(sanitizeNumber(42)).toBe(42);
      expect(sanitizeNumber('42')).toBe(42);
      expect(sanitizeNumber(3.14)).toBe(3.14);
    });

    it('should reject NaN', () => {
      expect(sanitizeNumber(NaN)).toBeNull();
    });

    it('should reject Infinity', () => {
      expect(sanitizeNumber(Infinity)).toBeNull();
      expect(sanitizeNumber(-Infinity)).toBeNull();
    });

    it('should reject non-numeric strings', () => {
      expect(sanitizeNumber('abc')).toBeNull();
    });
  });

  describe('sanitizeObjectKeys', () => {
    it('should remove __proto__', () => {
      const obj = { __proto__: { admin: true }, name: 'user' };
      const result = sanitizeObjectKeys(obj);
      expect(result).not.toHaveProperty('__proto__');
      expect(result.name).toBe('user');
    });

    it('should remove constructor', () => {
      const obj = { constructor: {}, name: 'user' };
      const result = sanitizeObjectKeys(obj);
      expect(result).not.toHaveProperty('constructor');
    });

    it('should remove prototype', () => {
      const obj = { prototype: {}, name: 'user' };
      const result = sanitizeObjectKeys(obj);
      expect(result).not.toHaveProperty('prototype');
    });
  });

  describe('sanitizeJson', () => {
    it('should parse valid JSON', () => {
      const result = sanitizeJson('{"name":"user"}');
      expect(result).toEqual({ name: 'user' });
    });

    it('should sanitize keys', () => {
      const result = sanitizeJson('{"__proto__":{"admin":true},"name":"user"}');
      expect(result).not.toHaveProperty('__proto__');
      expect(result?.name).toBe('user');
    });

    it('should reject invalid JSON', () => {
      expect(sanitizeJson('not json')).toBeNull();
      expect(sanitizeJson('{invalid}')).toBeNull();
    });

    it('should handle non-string input', () => {
      expect(sanitizeJson(null as unknown as string)).toBeNull();
      expect(sanitizeJson(undefined as unknown as string)).toBeNull();
    });
  });

  describe('sanitizeStellarAddress', () => {
    it('should accept valid Stellar addresses', () => {
      const address = 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJGERA7XOJVP3XVXCWPL6HUP';
      expect(sanitizeStellarAddress(address)).toBe(address);
    });

    it('should reject invalid Stellar addresses', () => {
      expect(sanitizeStellarAddress('INVALID')).toBe('');
      expect(sanitizeStellarAddress('0x123')).toBe('');
    });
  });

  describe('sanitizeBlockchainAddress', () => {
    it('should accept valid Ethereum addresses', () => {
      const address = '0x1234567890123456789012345678901234567890';
      expect(sanitizeBlockchainAddress(address)).toBe(address.toLowerCase());
    });

    it('should lowercase addresses', () => {
      const address = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
      expect(sanitizeBlockchainAddress(address)).toBe(address.toLowerCase());
    });

    it('should reject invalid addresses', () => {
      expect(sanitizeBlockchainAddress('0x123')).toBe('');
      expect(sanitizeBlockchainAddress('not-an-address')).toBe('');
    });
  });
});
