/**
 * Integration tests for cursor-based pagination (#804)
 *
 * Verifies:
 *   1. Pagination helper encodes / decodes cursors correctly.
 *   2. parsePaginationParams honours limit clamps.
 *   3. buildPaginatedResponse slices items and sets hasMore correctly.
 *   4. GET /api/transactions returns a paginated envelope.
 *   5. Subsequent pages can be fetched using the returned cursor.
 *   6. GET /api/v1/sync/history returns a paginated envelope.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  encodeCursor,
  decodeCursor,
  encodeOffsetCursor,
  decodeOffsetCursor,
  parsePaginationParams,
  buildPaginatedResponse,
  cursorToOffset,
  nextOffsetCursor,
} from '@/lib/pagination';

// ── Unit tests for the helper itself ──────────────────────────────────────

describe('pagination helper — cursor encoding', () => {
  it('round-trips a cursor', () => {
    const encoded = encodeCursor('tx_abc', 1700000000000);
    const decoded = decodeCursor(encoded);
    expect(decoded).toEqual({ id: 'tx_abc', ts: 1700000000000 });
  });

  it('returns null for empty cursor', () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor('')).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
  });

  it('returns null for malformed cursor', () => {
    expect(decodeCursor('not-base64!')).toBeNull();
    expect(decodeCursor('e30=')).toBeNull(); // valid base64 but missing id/ts fields
  });

  it('round-trips an offset cursor', () => {
    const enc = encodeOffsetCursor(40);
    expect(decodeOffsetCursor(enc)).toBe(40);
  });

  it('returns 0 for null offset cursor', () => {
    expect(decodeOffsetCursor(null)).toBe(0);
  });
});

describe('pagination helper — parsePaginationParams', () => {
  function req(qs: string) {
    return new NextRequest(`http://localhost/api/test?${qs}`);
  }

  it('defaults to limit=20 with no cursor', () => {
    const { limit, cursor } = parsePaginationParams(req(''));
    expect(limit).toBe(20);
    expect(cursor).toBeNull();
  });

  it('honours explicit limit', () => {
    const { limit } = parsePaginationParams(req('limit=50'));
    expect(limit).toBe(50);
  });

  it('clamps limit to max 200', () => {
    const { limit } = parsePaginationParams(req('limit=9999'));
    expect(limit).toBe(200);
  });

  it('clamps limit to min 1', () => {
    const { limit } = parsePaginationParams(req('limit=0'));
    expect(limit).toBe(1);
  });

  it('decodes a valid cursor', () => {
    const encoded = encodeCursor('tx_1', 123);
    const { cursor } = parsePaginationParams(req(`cursor=${encoded}`));
    expect(cursor).toEqual({ id: 'tx_1', ts: 123 });
  });
});

describe('pagination helper — buildPaginatedResponse', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({
    id: `tx_${i}`,
    ts: 1000 + i,
    value: i,
  }));

  it('returns hasMore=true and correct slice when items > limit', () => {
    const result = buildPaginatedResponse(items.slice(0, 21), 20, (i) => ({
      id: i.id,
      ts: i.ts,
    }));
    expect(result.data).toHaveLength(20);
    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextCursor).not.toBeNull();
  });

  it('returns hasMore=false on last page', () => {
    const result = buildPaginatedResponse(items.slice(0, 5), 20, (i) => ({
      id: i.id,
      ts: i.ts,
    }));
    expect(result.data).toHaveLength(5);
    expect(result.pagination.hasMore).toBe(false);
    expect(result.pagination.nextCursor).toBeNull();
  });
});

describe('pagination helper — offset utilities', () => {
  it('cursorToOffset returns 0 for first page', () => {
    expect(cursorToOffset(null)).toBe(0);
  });

  it('nextOffsetCursor is null when items < limit', () => {
    expect(nextOffsetCursor(0, 20, 15)).toBeNull();
  });

  it('nextOffsetCursor returns an encoded cursor when items === limit', () => {
    const nc = nextOffsetCursor(0, 20, 20);
    expect(nc).not.toBeNull();
    expect(decodeOffsetCursor(nc)).toBe(20);
  });
});

// ── Route integration tests ────────────────────────────────────────────────

vi.mock('@/lib/db/dal', () => {
  const txs = Array.from({ length: 45 }, (_, i) => ({
    id: `tx_${i}`,
    timestamp: Date.now() - i * 1000,
    userAddress: '0xWALLET',
    amount: '10',
    currency: 'NGN',
    status: 'completed',
    beneficiary: {
      institution: 'ACCESS',
      accountIdentifier: '1234567890',
      accountName: 'Alice',
      currency: 'NGN',
    },
  }));

  return {
    dal: {
      getByUser: vi.fn().mockResolvedValue(txs),
      save: vi.fn().mockResolvedValue(undefined),
    },
    DatabaseError: class DatabaseError extends Error {},
    getTransactions: vi.fn().mockResolvedValue(txs.slice(0, 21)),
    getTransactionById: vi.fn().mockResolvedValue(null),
  };
});

import { GET as transactionsGET } from '@/app/api/transactions/route';
import { GET as syncHistoryGET } from '@/app/api/v1/sync/history/route';

function makeReq(url: string) {
  return new NextRequest(`http://localhost${url}`);
}

describe('GET /api/transactions — cursor pagination', () => {
  it('returns paginated envelope on first page', async () => {
    const res = await transactionsGET(makeReq('/api/transactions?wallet=0xWALLET&limit=20'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('pagination');
    expect(body.pagination).toHaveProperty('limit', 20);
    expect(body.pagination).toHaveProperty('hasMore');
    expect(body.pagination).toHaveProperty('nextCursor');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(20);
  });

  it('advances to next page using cursor', async () => {
    const res1 = await transactionsGET(makeReq('/api/transactions?wallet=0xWALLET&limit=10'));
    const body1 = await res1.json();
    expect(body1.data).toHaveLength(10);
    expect(body1.pagination.hasMore).toBe(true);

    const cursor = body1.pagination.nextCursor;
    const res2 = await transactionsGET(
      makeReq(`/api/transactions?wallet=0xWALLET&limit=10&cursor=${cursor}`),
    );
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.data).toHaveLength(10);
    // Pages must not overlap
    const ids1 = body1.data.map((t: { id: string }) => t.id);
    const ids2 = body2.data.map((t: { id: string }) => t.id);
    const overlap = ids1.filter((id: string) => ids2.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it('returns 400 when wallet is missing', async () => {
    const res = await transactionsGET(makeReq('/api/transactions'));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/sync/history — cursor pagination', () => {
  it('returns paginated envelope', async () => {
    const res = await syncHistoryGET(makeReq('/api/v1/sync/history?wallet=0xWALLET&limit=15'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('pagination');
    expect(body.pagination.limit).toBe(15);
    expect(typeof body.pagination.hasMore).toBe('boolean');
  });

  it('returns 400 when wallet is missing', async () => {
    const res = await syncHistoryGET(makeReq('/api/v1/sync/history'));
    expect(res.status).toBe(400);
  });
});
