/**
 * Unit tests for PaycrestAdapter with mocked HTTP (issue #1500).
 *
 * All network calls go through HttpClient which calls `apiRequest` from
 * `@/lib/api/client`.  We mock that module so no real network activity occurs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    details: unknown;
    constructor(message: string, status: number, details?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.details = details;
    }
  },
}));

import { PaycrestAdapter } from '../paycrest-adapter';
import { apiRequest } from '@/lib/api/client';

const mockRequest = apiRequest as ReturnType<typeof vi.fn>;

const TEST_API_KEY = 'test-api-key-12345';

// ── createOrder ───────────────────────────────────────────────────────────────

describe('PaycrestAdapter.createOrder', () => {
  let adapter: PaycrestAdapter;

  beforeEach(() => {
    adapter = new PaycrestAdapter(TEST_API_KEY);
    vi.clearAllMocks();
  });

  it('POSTs to /sender/orders and returns the response', async () => {
    const mockResponse = { id: 'order_1', status: 'pending', receiveAddress: 'addr' };
    mockRequest.mockResolvedValueOnce(mockResponse);

    const result = await adapter.createOrder({
      amount: '100',
      currency: 'NGN',
      recipient: { accountNumber: '1234', bankCode: '044', name: 'John' },
    });

    expect(mockRequest).toHaveBeenCalledOnce();
    const [url] = mockRequest.mock.calls[0] as [string, ...unknown[]];
    expect(url).toContain('/sender/orders');
    expect(result).toEqual(mockResponse);
  });

  it('propagates HTTP errors from the server', async () => {
    const { ApiError } = await import('@/lib/api/client');
    mockRequest.mockRejectedValueOnce(new ApiError('Bad Request', 400));

    await expect(
      adapter.createOrder({
        amount: '-1',
        currency: 'NGN',
        recipient: { accountNumber: '1234', bankCode: '044', name: 'J' },
      }),
    ).rejects.toThrow();
  });

  it('retries on 429 Too Many Requests', async () => {
    const { ApiError } = await import('@/lib/api/client');
    const successResponse = { id: 'order_2', status: 'pending' };
    mockRequest
      .mockRejectedValueOnce(new ApiError('Too Many Requests', 429))
      .mockRejectedValueOnce(new ApiError('Too Many Requests', 429))
      .mockResolvedValueOnce(successResponse);

    const result = await adapter.createOrder({
      amount: '50',
      currency: 'NGN',
      recipient: { accountNumber: '1234', bankCode: '044', name: 'J' },
    });
    expect(result).toEqual(successResponse);
    expect(mockRequest).toHaveBeenCalledTimes(3);
  });
});

// ── getOrderStatus ────────────────────────────────────────────────────────────

describe('PaycrestAdapter.getOrderStatus', () => {
  let adapter: PaycrestAdapter;

  beforeEach(() => {
    adapter = new PaycrestAdapter(TEST_API_KEY);
    vi.clearAllMocks();
  });

  it('GETs /sender/orders/:id and maps the status', async () => {
    mockRequest.mockResolvedValueOnce({
      status: 'payment_order.settled',
      id: 'order_abc',
    });

    const result = await adapter.getOrderStatus('order_abc');
    expect(result.id).toBe('order_abc');
    // The adapter returns the raw status string from Paycrest.
    expect(result.status).toBe('payment_order.settled');

    const [url] = mockRequest.mock.calls[0] as [string, ...unknown[]];
    expect(url).toContain('/sender/orders/order_abc');
  });

  it('throws on 404 for an unknown order', async () => {
    const { ApiError } = await import('@/lib/api/client');
    mockRequest.mockRejectedValueOnce(new ApiError('Not Found', 404));

    await expect(adapter.getOrderStatus('ghost_order')).rejects.toThrow();
  });

  it('propagates server errors (5xx) after retries', async () => {
    const { ApiError } = await import('@/lib/api/client');
    mockRequest.mockRejectedValue(new ApiError('Internal Server Error', 500));

    await expect(adapter.getOrderStatus('order_x')).rejects.toThrow();
  });
});

// ── getCurrencies ─────────────────────────────────────────────────────────────

describe('PaycrestAdapter.getCurrencies', () => {
  let adapter: PaycrestAdapter;

  beforeEach(() => {
    adapter = new PaycrestAdapter(TEST_API_KEY);
    vi.clearAllMocks();
  });

  it('returns the currency list from the API', async () => {
    const mockCurrencies = [
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
      { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    ];
    mockRequest.mockResolvedValueOnce(mockCurrencies);

    const result = await adapter.getCurrencies();
    expect(result).toHaveLength(2);
    expect(result[0].code).toBe('NGN');
  });

  it('throws on network failure', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Network error'));
    await expect(adapter.getCurrencies()).rejects.toThrow('Network error');
  });
});

// ── getInstitutions ───────────────────────────────────────────────────────────

describe('PaycrestAdapter.getInstitutions', () => {
  let adapter: PaycrestAdapter;

  beforeEach(() => {
    adapter = new PaycrestAdapter(TEST_API_KEY);
    vi.clearAllMocks();
  });

  it('GETs institutions for a given currency', async () => {
    const mockInstitutions = [
      { code: '044', name: 'Access Bank' },
      { code: '058', name: 'GTBank' },
    ];
    mockRequest.mockResolvedValueOnce(mockInstitutions);

    const result = await adapter.getInstitutions('NGN');
    expect(result).toHaveLength(2);
    const [url] = mockRequest.mock.calls[0] as [string, ...unknown[]];
    expect(url).toContain('/sender/institutions/NGN');
  });
});

// ── verifyAccount ─────────────────────────────────────────────────────────────

describe('PaycrestAdapter.verifyAccount', () => {
  let adapter: PaycrestAdapter;

  beforeEach(() => {
    adapter = new PaycrestAdapter(TEST_API_KEY);
    vi.clearAllMocks();
  });

  it('returns the account name from the response', async () => {
    mockRequest.mockResolvedValueOnce({ accountName: 'John Doe' });
    const result = await adapter.verifyAccount('044', '1234567890');
    expect(result).toBe('John Doe');
  });

  it('falls back to response.data when accountName is absent', async () => {
    mockRequest.mockResolvedValueOnce({ data: 'Jane Doe' });
    const result = await adapter.verifyAccount('058', '0987654321');
    expect(result).toBe('Jane Doe');
  });

  it('returns empty string on API error (silent failure)', async () => {
    mockRequest.mockRejectedValueOnce(new Error('lookup failed'));
    const result = await adapter.verifyAccount('000', 'bad_account');
    expect(result).toBe('');
  });
});

// ── getHealth ─────────────────────────────────────────────────────────────────

describe('PaycrestAdapter.getHealth', () => {
  let adapter: PaycrestAdapter;

  beforeEach(() => {
    adapter = new PaycrestAdapter(TEST_API_KEY);
    vi.clearAllMocks();
  });

  it('returns ok:true when the API responds', async () => {
    mockRequest.mockResolvedValueOnce([{ code: 'NGN' }]);
    const health = await adapter.getHealth();
    expect(health.ok).toBe(true);
    expect(typeof health.latencyMs).toBe('number');
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('returns ok:false with an error message when the API throws', async () => {
    mockRequest.mockRejectedValueOnce(new Error('timeout'));
    const health = await adapter.getHealth();
    expect(health.ok).toBe(false);
    expect(health.error).toBe('timeout');
  });

  it('returns ok:false with a fallback message for non-Error throws', async () => {
    mockRequest.mockRejectedValueOnce('string error');
    const health = await adapter.getHealth();
    expect(health.ok).toBe(false);
    expect(health.error).toBe('Unknown error');
  });
});

// ── getRate ───────────────────────────────────────────────────────────────────

describe('PaycrestAdapter.getRate', () => {
  let adapter: PaycrestAdapter;

  beforeEach(() => {
    adapter = new PaycrestAdapter(TEST_API_KEY);
    vi.clearAllMocks();
  });

  it('parses a numeric rate from response.data', async () => {
    mockRequest.mockResolvedValueOnce({ data: '1550.5' });
    const rate = await adapter.getRate('USDC', '100', 'NGN');
    expect(rate).toBe(1550.5);
  });

  it('throws when the response is not a valid number', async () => {
    mockRequest.mockResolvedValueOnce({ data: 'not-a-number' });
    await expect(adapter.getRate('USDC', '100', 'NGN')).rejects.toThrow('Invalid rate received');
  });

  it('appends optional query params to the URL', async () => {
    mockRequest.mockResolvedValueOnce({ data: '1600' });
    await adapter.getRate('USDC', '100', 'NGN', { network: 'stellar', providerId: 'prov1' });

    const [url] = mockRequest.mock.calls[0] as [string, ...unknown[]];
    expect(url).toContain('network=stellar');
    expect(url).toContain('provider_id=prov1');
  });
});
