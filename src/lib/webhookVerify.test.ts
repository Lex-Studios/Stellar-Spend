/**
 * Unit tests for src/lib/webhookVerify.ts (#1331)
 * Covers: valid signatures, tampered payloads, expired timestamps,
 *         replay window expiry, missing headers, and helper exports.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  verifyHmacSignature,
  verifyWebhookSignature,
  verifyProviderSignature,
  generateOutgoingSignature,
  buildSignedWebhookHeaders,
} from './webhookVerify';

// ─── Mock DB pool (nonce store) ───────────────────────────────────────────────

vi.mock('./db/client', () => ({
  pool: {
    query: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    withContext: vi.fn().mockReturnThis(),
  },
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

const SECRET = 'webhook-test-secret';
const PAYLOAD = '{"event":"payment_order.settled","data":{"id":"order_abc"}}';

async function makeHmac(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Buffer.from(mac).toString('hex');
}

// ─── verifyHmacSignature ─────────────────────────────────────────────────────

describe('verifyHmacSignature', () => {
  it('accepts a valid HMAC signature', async () => {
    const sig = await makeHmac(PAYLOAD, SECRET);
    const result = await verifyHmacSignature(PAYLOAD, sig, SECRET);
    expect(result.valid).toBe(true);
  });

  it('rejects a tampered payload', async () => {
    const sig = await makeHmac(PAYLOAD, SECRET);
    const tampered = PAYLOAD.replace('settled', 'pending');
    const result = await verifyHmacSignature(tampered, sig, SECRET);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/invalid/i);
  });

  it('rejects a wrong signature', async () => {
    const result = await verifyHmacSignature(PAYLOAD, 'deadbeef'.repeat(8), SECRET);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/invalid/i);
  });

  it('rejects null / empty signature', async () => {
    const resultNull = await verifyHmacSignature(PAYLOAD, null, SECRET);
    expect(resultNull.valid).toBe(false);
    expect(resultNull.reason).toMatch(/missing/i);

    const resultEmpty = await verifyHmacSignature(PAYLOAD, '', SECRET);
    expect(resultEmpty.valid).toBe(false);
  });

  it('rejects empty secret', async () => {
    const sig = await makeHmac(PAYLOAD, SECRET);
    const result = await verifyHmacSignature(PAYLOAD, sig, '');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/secret/i);
  });
});

// ─── verifyWebhookSignature ───────────────────────────────────────────────────

describe('verifyWebhookSignature', () => {
  const FIXED_NOW = 1_700_000_000_000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts a valid signature without timestamp', async () => {
    const sig = await makeHmac(PAYLOAD, SECRET);
    const result = await verifyWebhookSignature(PAYLOAD, sig, SECRET);
    expect(result.valid).toBe(true);
  });

  it('accepts a valid signature with a fresh timestamp', async () => {
    const sig = await makeHmac(PAYLOAD, SECRET);
    const result = await verifyWebhookSignature(PAYLOAD, sig, SECRET, String(FIXED_NOW));
    expect(result.valid).toBe(true);
  });

  it('rejects a tampered payload', async () => {
    const sig = await makeHmac(PAYLOAD, SECRET);
    const tampered = PAYLOAD.replace('settled', 'failed');
    const result = await verifyWebhookSignature(tampered, sig, SECRET);
    expect(result.valid).toBe(false);
  });

  it('rejects an expired timestamp (> 5 minutes old)', async () => {
    const sig = await makeHmac(PAYLOAD, SECRET);
    const expiredTs = String(FIXED_NOW - 10 * 60 * 1000); // 10 min ago
    const result = await verifyWebhookSignature(PAYLOAD, sig, SECRET, expiredTs);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/timestamp/i);
  });

  it('rejects a future timestamp beyond tolerance', async () => {
    const sig = await makeHmac(PAYLOAD, SECRET);
    const futureTs = String(FIXED_NOW + 10 * 60 * 1000); // 10 min in future
    const result = await verifyWebhookSignature(PAYLOAD, sig, SECRET, futureTs);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/timestamp/i);
  });

  it('rejects a non-numeric timestamp', async () => {
    const sig = await makeHmac(PAYLOAD, SECRET);
    const result = await verifyWebhookSignature(PAYLOAD, sig, SECRET, 'not-a-number');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/timestamp/i);
  });

  it('rejects a missing signature', async () => {
    const result = await verifyWebhookSignature(PAYLOAD, '', SECRET, String(FIXED_NOW));
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/missing/i);
  });

  it('detects replay when the same nonce is reused', async () => {
    const { pool } = await import('./db/client');
    const mockQuery = vi.mocked(pool.query);

    // First call: nonce not seen yet (isReplay → false), then markNonceUsed
    mockQuery.mockResolvedValueOnce({ rows: [] } as never); // pruneExpiredNonces
    mockQuery.mockResolvedValueOnce({ rows: [] } as never); // isReplay → not seen
    mockQuery.mockResolvedValueOnce({ rows: [] } as never); // markNonceUsed

    const sig = await makeHmac(PAYLOAD, SECRET);
    const first = await verifyWebhookSignature(PAYLOAD, sig, SECRET, null, 'nonce-unique-1');
    expect(first.valid).toBe(true);

    // Second call: same nonce is now recorded
    mockQuery.mockResolvedValueOnce({ rows: [] } as never); // pruneExpiredNonces
    mockQuery.mockResolvedValueOnce({ rows: [{ 1: 1 }] } as never); // isReplay → seen

    const second = await verifyWebhookSignature(PAYLOAD, sig, SECRET, null, 'nonce-unique-1');
    expect(second.valid).toBe(false);
    expect(second.reason).toMatch(/replay/i);
  });
});

// ─── verifyProviderSignature ─────────────────────────────────────────────────

describe('verifyProviderSignature', () => {
  const FIXED_NOW = 1_700_000_000_000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts valid signature with timestamp and nonce options', async () => {
    const { pool } = await import('./db/client');
    vi.mocked(pool.query).mockResolvedValue({ rows: [] } as never);

    const sig = await makeHmac(PAYLOAD, SECRET);
    const result = await verifyProviderSignature(PAYLOAD, sig, SECRET, {
      timestamp: String(FIXED_NOW),
      nonce: 'provider-nonce-ok',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects empty signature with options', async () => {
    const result = await verifyProviderSignature(PAYLOAD, '', SECRET, {});
    expect(result.valid).toBe(false);
  });
});

// ─── generateOutgoingSignature ────────────────────────────────────────────────

describe('generateOutgoingSignature', () => {
  it('generates a 64-char hex HMAC', async () => {
    const sig = await generateOutgoingSignature(PAYLOAD, SECRET);
    expect(sig).toHaveLength(64);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for same inputs', async () => {
    const sig1 = await generateOutgoingSignature(PAYLOAD, SECRET);
    const sig2 = await generateOutgoingSignature(PAYLOAD, SECRET);
    expect(sig1).toBe(sig2);
  });

  it('differs when payload changes', async () => {
    const sig1 = await generateOutgoingSignature(PAYLOAD, SECRET);
    const sig2 = await generateOutgoingSignature(PAYLOAD + 'x', SECRET);
    expect(sig1).not.toBe(sig2);
  });
});

// ─── buildSignedWebhookHeaders ────────────────────────────────────────────────

describe('buildSignedWebhookHeaders', () => {
  it('returns required headers with correct types', async () => {
    const headers = await buildSignedWebhookHeaders(PAYLOAD, SECRET);
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Webhook-Timestamp']).toBeDefined();
    expect(typeof headers['X-Webhook-Timestamp']).toBe('string');
    expect(headers['X-Webhook-Signature']).toHaveLength(64);
  });

  it('timestamp is a recent Unix ms value', async () => {
    const before = Date.now();
    const headers = await buildSignedWebhookHeaders(PAYLOAD, SECRET);
    const after = Date.now();
    const ts = parseInt(headers['X-Webhook-Timestamp'], 10);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});
