/**
 * Tests for shared service types (issue #1540).
 * Validates that the ServiceQuoteRequest and ServiceQuoteResponse
 * types are structurally correct and exported from the shared package.
 */

import { describe, it, expect } from 'vitest';
import type { ServiceQuoteRequest, ServiceQuoteResponse } from './services';

describe('ServiceQuoteRequest', () => {
  it('accepts valid fee methods', () => {
    const validMethods: ServiceQuoteRequest['feeMethod'][] = [
      'USDC',
      'XLM',
      'stablecoin',
      'native',
    ];
    for (const feeMethod of validMethods) {
      const req: ServiceQuoteRequest = { amount: '100', currency: 'NGN', feeMethod };
      expect(req.feeMethod).toBe(feeMethod);
    }
  });

  it('requires amount, currency, and feeMethod fields', () => {
    const req: ServiceQuoteRequest = {
      amount: '50.00',
      currency: 'KES',
      feeMethod: 'stablecoin',
    };
    expect(req.amount).toBe('50.00');
    expect(req.currency).toBe('KES');
    expect(req.feeMethod).toBe('stablecoin');
  });
});

describe('ServiceQuoteResponse', () => {
  it('has the expected shape', () => {
    const resp: ServiceQuoteResponse = {
      destinationAmount: '4850.00',
      rate: 1550.0,
      currency: 'NGN',
      bridgeFee: '0.50',
      payoutFee: '1.00',
      estimatedTime: 300,
    };
    expect(resp.destinationAmount).toBe('4850.00');
    expect(resp.rate).toBe(1550.0);
    expect(typeof resp.estimatedTime).toBe('number');
  });
});
