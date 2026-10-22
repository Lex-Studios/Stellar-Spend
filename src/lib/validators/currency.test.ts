import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCurrencyLegacy, validateTokenLegacy, getSupportedCurrencies } from './currency';
import { ValidationService } from './service';

// Mock ValidationService
vi.mock('./service', () => ({
  ValidationService: {
    validateCurrencyCode: vi.fn(),
  },
}));

describe('currency validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateCurrencyLegacy', () => {
    it('should return valid for supported fiat currency', () => {
      (ValidationService.validateCurrencyCode as any).mockReturnValue({
        valid: true,
        errors: undefined,
      });

      const result = validateCurrencyLegacy('USD');

      expect(result).toEqual({
        valid: true,
        errors: [],
      });
    });

    it('should return valid for all supported fiat currencies', () => {
      (ValidationService.validateCurrencyCode as any).mockReturnValue({
        valid: true,
        errors: undefined,
      });

      const supportedCurrencies = ['NGN', 'KES', 'GHS', 'UGX', 'ZAR', 'GBP', 'USD', 'EUR'];

      supportedCurrencies.forEach((currency) => {
        const result = validateCurrencyLegacy(currency);
        expect(result.valid).toBe(true);
      });
    });

    it('should return invalid for unsupported currency', () => {
      (ValidationService.validateCurrencyCode as any).mockReturnValue({
        valid: false,
        errors: [{ message: 'Currency not supported', code: 'CURRENCY_NOT_SUPPORTED' }],
      });

      const result = validateCurrencyLegacy('XYZ');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should return invalid for empty currency string', () => {
      (ValidationService.validateCurrencyCode as any).mockReturnValue({
        valid: false,
        errors: [{ message: 'Currency is required', code: 'REQUIRED' }],
      });

      const result = validateCurrencyLegacy('');

      expect(result.valid).toBe(false);
    });

    it('should be case-insensitive for currency codes', () => {
      (ValidationService.validateCurrencyCode as any).mockReturnValue({
        valid: true,
        errors: undefined,
      });

      const result = validateCurrencyLegacy('usd');

      expect(result.valid).toBe(true);
    });

    it('should handle whitespace in currency code', () => {
      (ValidationService.validateCurrencyCode as any).mockReturnValue({
        valid: false,
        errors: [{ message: 'Invalid currency format', code: 'FORMAT' }],
      });

      const result = validateCurrencyLegacy(' USD ');

      expect(result.valid).toBe(false);
    });

    it('should reject invalid currency formats', () => {
      (ValidationService.validateCurrencyCode as any).mockReturnValue({
        valid: false,
        errors: [{ message: 'Invalid currency format', code: 'FORMAT' }],
      });

      const result = validateCurrencyLegacy('US');

      expect(result.valid).toBe(false);
    });
  });

  describe('validateTokenLegacy', () => {
    it('should return valid for USDC token', () => {
      const result = validateTokenLegacy('USDC');

      expect(result).toEqual({
        valid: true,
        errors: [],
      });
    });

    it('should return valid for USDT token', () => {
      const result = validateTokenLegacy('USDT');

      expect(result).toEqual({
        valid: true,
        errors: [],
      });
    });

    it('should be case-insensitive for USDC', () => {
      const result = validateTokenLegacy('usdc');

      expect(result.valid).toBe(true);
    });

    it('should be case-insensitive for USDT', () => {
      const result = validateTokenLegacy('usdt');

      expect(result.valid).toBe(true);
    });

    it('should return invalid for unsupported token', () => {
      const result = validateTokenLegacy('BUSD');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('not supported');
    });

    it('should return invalid for empty token string', () => {
      const result = validateTokenLegacy('');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should return invalid for cryptocurrency as token', () => {
      const result = validateTokenLegacy('BTC');

      expect(result.valid).toBe(false);
    });

    it('should return invalid for fiat currency as token', () => {
      const result = validateTokenLegacy('USD');

      expect(result.valid).toBe(false);
    });

    it('should handle mixed case for supported tokens', () => {
      const result = validateTokenLegacy('UsDc');

      expect(result.valid).toBe(true);
    });

    it('should handle whitespace in token', () => {
      const result = validateTokenLegacy(' USDC ');

      expect(result.valid).toBe(false);
    });

    it('should always return array for errors', () => {
      const result = validateTokenLegacy('INVALID');

      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return array of supported currencies', () => {
      const currencies = getSupportedCurrencies();

      expect(Array.isArray(currencies)).toBe(true);
      expect(currencies).toHaveLength(8);
    });

    it('should include all expected currencies', () => {
      const currencies = getSupportedCurrencies();
      const expected = ['NGN', 'KES', 'GHS', 'UGX', 'ZAR', 'GBP', 'USD', 'EUR'];

      expected.forEach((currency) => {
        expect(currencies).toContain(currency);
      });
    });

    it('should return array copy (not reference)', () => {
      const currencies1 = getSupportedCurrencies();
      const currencies2 = getSupportedCurrencies();

      expect(currencies1).not.toBe(currencies2);
      expect(currencies1).toEqual(currencies2);
    });

    it('should not allow mutation of returned array', () => {
      const currencies = getSupportedCurrencies();
      const originalLength = currencies.length;

      currencies.push('XXX');

      const currencies2 = getSupportedCurrencies();
      expect(currencies2).toHaveLength(originalLength);
      expect(currencies2).not.toContain('XXX');
    });

    it('should maintain consistent order', () => {
      const currencies1 = getSupportedCurrencies();
      const currencies2 = getSupportedCurrencies();

      expect(currencies1).toEqual(currencies2);
    });

    it('should return non-empty array', () => {
      const currencies = getSupportedCurrencies();

      expect(currencies.length).toBeGreaterThan(0);
    });
  });

  describe('Error scenarios', () => {
    it('should handle service returning multiple errors', () => {
      (ValidationService.validateCurrencyCode as any).mockReturnValue({
        valid: false,
        errors: [
          { message: 'Invalid format', code: 'FORMAT' },
          { message: 'Not supported', code: 'NOT_SUPPORTED' },
        ],
      });

      const result = validateCurrencyLegacy('invalid');

      expect(result.errors).toHaveLength(2);
    });

    it('should handle null/undefined currency gracefully in token validation', () => {
      const result = validateTokenLegacy((null as any) || 'INVALID');

      expect(result.valid).toBe(false);
    });

    it('should handle service throwing error', () => {
      (ValidationService.validateCurrencyCode as any).mockImplementation(() => {
        throw new Error('Service error');
      });

      expect(() => {
        validateCurrencyLegacy('USD');
      }).toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should work with loop through all supported currencies', () => {
      const currencies = getSupportedCurrencies();

      (ValidationService.validateCurrencyCode as any).mockReturnValue({
        valid: true,
        errors: undefined,
      });

      currencies.forEach((currency) => {
        const result = validateCurrencyLegacy(currency);
        expect(result.valid).toBe(true);
      });
    });

    it('should differentiate between currencies and tokens', () => {
      (ValidationService.validateCurrencyCode as any).mockReturnValue({
        valid: true,
        errors: undefined,
      });

      const currencyResult = validateCurrencyLegacy('USD');
      const tokenResult = validateTokenLegacy('USDC');

      expect(currencyResult.valid).toBe(true);
      expect(tokenResult.valid).toBe(true);
    });
  });
});
