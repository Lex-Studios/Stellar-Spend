import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaycrestAdapter, PaycrestHttpError } from '../lib/offramp/adapters/paycrest-adapter';

const adapter = new PaycrestAdapter('test-api-key');

function mockFetch(data: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      statusText: ok ? 'OK' : 'Bad Request',
      json: () => Promise.resolve(data),
    })
  );
}

beforeEach(() => vi.restoreAllMocks());

describe('PaycrestAdapter.getRate', () => {
  it('returns a valid NGN/USDC rate when data is a number', async () => {
    mockFetch({ data: 1580.5 });
    const rate = await adapter.getRate('USDC', '100', 'NGN');
    expect(rate).toBe(1580.5);
    expect(isFinite(rate)).toBe(true);
  });

  it('returns a valid rate when data is a string', async () => {
    mockFetch({ data: '1580.5' });
    const rate = await adapter.getRate('USDC', '100', 'NGN');
    expect(rate).toBe(1580.5);
  });

  it('calls the correct path-param endpoint', async () => {
    const spy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 1500 }),
    });
    vi.stubGlobal('fetch', spy);

    await adapter.getRate('USDC', '50', 'NGN', { network: 'base', providerId: 'p1' });

    const calledUrl: string = spy.mock.calls[0][0];
    expect(calledUrl).toContain('/rates/USDC/50/NGN');
    expect(calledUrl).toContain('network=base');
    expect(calledUrl).toContain('provider_id=p1');
  });

  it('throws when rate is not finite (NaN)', async () => {
    mockFetch({ data: 'not-a-number' });
    await expect(adapter.getRate('USDC', '100', 'NGN')).rejects.toThrow('Invalid rate');
  });

  it('throws when data field is missing', async () => {
    mockFetch({});
    await expect(adapter.getRate('USDC', '100', 'NGN')).rejects.toThrow('Invalid rate');
  });

  it('throws PaycrestHttpError on non-ok response', async () => {
    mockFetch({ message: 'Unauthorized' }, false, 401);
    await expect(adapter.getRate('USDC', '100', 'NGN')).rejects.toBeInstanceOf(PaycrestHttpError);
  });
});
