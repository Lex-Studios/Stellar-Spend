/**
 * Contract tests for PayoutProviderAdapter (#1302)
 * Every payout adapter must expose the full interface and return typed results.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const httpGet = vi.fn();
const httpPost = vi.fn();

vi.mock('../../clients/http-client', () => ({
  HttpClient: class {
    get = httpGet;
    post = httpPost;
  },
}));

import { PaycrestAdapter } from './paycrest-adapter';
import type { PayoutProviderAdapter } from './payout-provider';

const REQUIRED_METHODS: Array<keyof PayoutProviderAdapter> = [
  'getCurrencies',
  'getInstitutions',
  'verifyAccount',
  'getRate',
  'createOrder',
  'getOrderStatus',
  'getHealth',
];

describe('PayoutProviderAdapter contract', () => {
  let adapter: PayoutProviderAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new PaycrestAdapter('test-key');
  });

  it('exposes every method of the PayoutProviderAdapter interface', () => {
    for (const method of REQUIRED_METHODS) {
      expect(typeof (adapter as unknown as Record<string, unknown>)[method]).toBe('function');
    }
  });

  it('getHealth resolves to a typed PayoutHealth result', async () => {
    httpGet.mockResolvedValueOnce({ data: [] });
    const health = await adapter.getHealth();
    expect(typeof health.ok).toBe('boolean');
    expect(typeof health.latencyMs).toBe('number');
  });

  it('getOrderStatus returns a status and id', async () => {
    httpGet.mockResolvedValueOnce({ status: 'payment_order.settled', id: 'ord_1' });
    const result = await adapter.getOrderStatus('ord_1');
    expect(result).toEqual({ status: 'settled', id: 'ord_1' });
  });

  it('getCurrencies resolves to an array of { code, name, symbol }', async () => {
    httpGet.mockResolvedValueOnce([{ code: 'NGN', name: 'Naira', symbol: '₦' }]);
    const currencies = await adapter.getCurrencies();
    expect(Array.isArray(currencies)).toBe(true);
    for (const c of currencies) {
      expect(typeof c.code).toBe('string');
      expect(typeof c.name).toBe('string');
      expect(typeof c.symbol).toBe('string');
    }
  });

  it('getRate resolves to a finite number', async () => {
    httpGet.mockResolvedValueOnce({ data: '1550.5' });
    const rate = await adapter.getRate('USDC', '10', 'NGN');
    expect(rate).toBe(1550.5);
  });
});
