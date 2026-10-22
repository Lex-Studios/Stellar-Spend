/**
 * Tests that route-level rate limits are enforced by the shared middleware
 * helper (applyRateLimit) and emit X-RateLimit-* / Retry-After headers.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

const store = vi.hoisted(() => new Map<string, string>());

vi.mock('@/lib/cache/client', () => ({
  getCacheClient: () => ({
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: string) => {
      store.set(key, value);
    },
    del: async (key: string) => {
      store.delete(key);
    },
    keys: async () => [],
    flushPattern: async () => {},
    ping: async () => true,
  }),
}));

import { applyRateLimit, RATE_LIMIT_REGISTRY } from '@/lib/rateLimiter';

function makeRequest(ip: string): NextRequest {
  return new NextRequest('http://localhost/api/offramp/bridge/build-tx', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
  });
}

describe('applyRateLimit (route-level enforcement)', () => {
  beforeEach(() => {
    store.clear();
  });

  it('allows requests up to the registered limit and returns null', async () => {
    const limit = RATE_LIMIT_REGISTRY['build-tx'].maxRequests;
    for (let i = 0; i < limit; i++) {
      const res = await applyRateLimit(makeRequest('10.0.0.1'), 'build-tx');
      expect(res).toBeNull();
    }
  });

  it('returns 429 with limit headers once the limit is exceeded', async () => {
    const { maxRequests } = RATE_LIMIT_REGISTRY['build-tx'];
    for (let i = 0; i < maxRequests; i++) {
      await applyRateLimit(makeRequest('10.0.0.2'), 'build-tx');
    }

    const res = await applyRateLimit(makeRequest('10.0.0.2'), 'build-tx');
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    expect(res!.headers.get('X-RateLimit-Limit')).toBe(String(maxRequests));
    expect(res!.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(res!.headers.get('X-RateLimit-Reset')).toMatch(/^\d+$/);
    expect(Number(res!.headers.get('Retry-After'))).toBeGreaterThan(0);

    const body = await res!.json();
    expect(body.error).toBe('TOO_MANY_REQUESTS');
  });

  it('tracks limits per client so one IP does not block another', async () => {
    const { maxRequests } = RATE_LIMIT_REGISTRY['paycrest-order'];
    for (let i = 0; i < maxRequests; i++) {
      await applyRateLimit(makeRequest('10.0.0.3'), 'paycrest-order');
    }
    expect(await applyRateLimit(makeRequest('10.0.0.3'), 'paycrest-order')).not.toBeNull();
    expect(await applyRateLimit(makeRequest('10.0.0.4'), 'paycrest-order')).toBeNull();
  });

  it('does not rate-limit namespaces with no registered config', async () => {
    expect(await applyRateLimit(makeRequest('10.0.0.5'), 'unknown-namespace')).toBeNull();
  });
});
