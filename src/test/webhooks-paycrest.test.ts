import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Env mock ──────────────────────────────────────────────────────────────────
vi.mock('@/lib/env', () => ({
  env: {
    server: {
      PAYCREST_WEBHOOK_SECRET: 'test-webhook-secret',
      PAYCREST_API_KEY: 'test-api-key',
      BASE_PRIVATE_KEY: '0xdeadbeef',
      BASE_RETURN_ADDRESS: '0xreturn',
      BASE_RPC_URL: 'https://base-rpc.test',
      STELLAR_SOROBAN_RPC_URL: 'https://soroban.test',
      STELLAR_HORIZON_URL: 'https://horizon.test',
    },
    public: {
      NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL: 'https://soroban.test',
      NEXT_PUBLIC_BASE_RETURN_ADDRESS: '0xreturn',
      NEXT_PUBLIC_STELLAR_USDC_ISSUER: 'GISSUER',
    },
  },
}));

import { POST } from '@/app/api/webhooks/paycrest/route';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function hmacHex(body: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return Buffer.from(mac).toString('hex');
}

function makeRequest(body: string, signature: string): Request {
  return new Request('http://localhost/api/webhooks/paycrest', {
    method: 'POST',
    body,
    headers: { 'X-Paycrest-Signature': signature },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/webhooks/paycrest', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 200 with valid signature', async () => {
    const body = JSON.stringify({ event: 'payment_order.settled', data: { id: 'order-1' } });
    const sig = await hmacHex(body, 'test-webhook-secret');
    const res = await POST(makeRequest(body, sig));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
  });

  it('returns 401 with invalid signature', async () => {
    const body = JSON.stringify({ event: 'payment_order.settled', data: { id: 'order-1' } });
    const res = await POST(makeRequest(body, 'bad-signature'));
    expect(res.status).toBe(401);
  });

  it('returns 401 when signature header is missing', async () => {
    const body = JSON.stringify({ event: 'payment_order.settled', data: { id: 'order-1' } });
    const req = new Request('http://localhost/api/webhooks/paycrest', { method: 'POST', body });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('logs order id and status for payment_order.settled', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    const body = JSON.stringify({ event: 'payment_order.settled', data: { id: 'order-42' } });
    const sig = await hmacHex(body, 'test-webhook-secret');
    await POST(makeRequest(body, sig));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('order-42'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('settled'));
  });

  it('warns on unhandled event type', async () => {
    const warnSpy = vi.spyOn(console, 'warn');
    const body = JSON.stringify({ event: 'payment_order.unknown', data: { id: 'order-99' } });
    const sig = await hmacHex(body, 'test-webhook-secret');
    await POST(makeRequest(body, sig));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('unhandled event'));
  });
});
