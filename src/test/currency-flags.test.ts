import { describe, it, expect } from 'vitest';
import { getCurrencyFlag } from '@/lib/currency-flags';

describe('getCurrencyFlag', () => {
  it('returns flag for known currencies', () => {
    expect(getCurrencyFlag('NGN')).toBe('🇳🇬');
    expect(getCurrencyFlag('KES')).toBe('🇰🇪');
    expect(getCurrencyFlag('GHS')).toBe('🇬🇭');
    expect(getCurrencyFlag('USD')).toBe('🇺🇸');
  });

  it('is case-insensitive', () => {
    expect(getCurrencyFlag('ngn')).toBe('🇳🇬');
    expect(getCurrencyFlag('Kes')).toBe('🇰🇪');
  });

  it('returns empty string for unknown currency', () => {
    expect(getCurrencyFlag('XYZ')).toBe('');
    expect(getCurrencyFlag('ABC')).toBe('');
  });

  it('returns empty string for empty string input', () => {
    expect(getCurrencyFlag('')).toBe('');
  });

  it('returns flags for all supported currencies', () => {
    const supported = ['NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS', 'BRL', 'INR', 'PHP', 'AED'];
    for (const code of supported) {
      expect(getCurrencyFlag(code)).not.toBe('');
    }
  });
});
