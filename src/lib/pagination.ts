/**
 * Cursor-based pagination helper (#804)
 *
 * Provides a consistent pagination contract across all list endpoints.
 *
 * ## Contract
 *
 * Request (query params):
 *   - `limit`  — page size, 1–200, default 20
 *   - `cursor` — opaque continuation token returned by the previous page
 *                (omit / empty string for the first page)
 *
 * Response envelope (use `paginatedResponse`):
 *   ```json
 *   {
 *     "data": [...],
 *     "pagination": {
 *       "limit": 20,
 *       "nextCursor": "dXNlcl8x...",   // null on the last page
 *       "hasMore": true
 *     }
 *   }
 *   ```
 *
 * ## Cursor format
 *
 * The cursor is a base-64–encoded JSON object `{ id: string; ts: number }`.
 * The `id` is the last record's stable identifier and `ts` is its creation
 * timestamp.  The combination lets the DB use a compound index for efficient
 * keyset pagination without exposing raw DB row IDs.
 *
 * For offset-based data sources that cannot be migrated immediately, pass
 * the `offset` utility which transparently encodes the integer offset as a
 * cursor — the client API surface is identical.
 */

import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CursorPayload {
  id: string;
  ts: number;
}

export interface PaginationParams {
  /** Maximum number of records to return (1–200). */
  limit: number;
  /** Decoded cursor, or null for the first page. */
  cursor: CursorPayload | null;
}

export interface PaginationMeta {
  limit: number;
  /** Opaque token the client passes as `cursor` to fetch the next page.
   *  `null` when there are no more records. */
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;
const MIN_LIMIT = 1;

// ── Encoding / decoding ────────────────────────────────────────────────────

/**
 * Encode a `{ id, ts }` pair to an opaque base-64 cursor string.
 */
export function encodeCursor(id: string, ts: number): string {
  const payload: CursorPayload = { id, ts };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/**
 * Decode a base-64 cursor string back to `{ id, ts }`.
 * Returns `null` if the cursor is absent, empty, or malformed.
 */
export function decodeCursor(cursor: string | null | undefined): CursorPayload | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as CursorPayload).id === 'string' &&
      typeof (parsed as CursorPayload).ts === 'number'
    ) {
      return parsed as CursorPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Encode a plain integer offset as a cursor.
 * Allows offset-backed endpoints to expose the cursor API surface.
 */
export function encodeOffsetCursor(offset: number): string {
  return encodeCursor(`__offset__${offset}`, offset);
}

/**
 * Decode an offset-cursor back to an integer.
 * Returns `0` for the first page or any decoding failure.
 */
export function decodeOffsetCursor(cursor: string | null | undefined): number {
  const payload = decodeCursor(cursor);
  if (!payload) return 0;
  if (payload.id.startsWith('__offset__')) {
    const n = parseInt(payload.id.replace('__offset__', ''), 10);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

// ── Request parsing ────────────────────────────────────────────────────────

/**
 * Parse `limit` and `cursor` from a Next.js request's search params.
 *
 * Clamps `limit` to [MIN_LIMIT, MAX_LIMIT] and returns a decoded cursor.
 */
export function parsePaginationParams(request: NextRequest): PaginationParams {
  const params = request.nextUrl.searchParams;
  const rawLimit = params.get('limit');
  const rawCursor = params.get('cursor');

  let limit = rawLimit ? parseInt(rawLimit, 10) : DEFAULT_LIMIT;
  if (isNaN(limit) || limit < MIN_LIMIT) limit = MIN_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return {
    limit,
    cursor: decodeCursor(rawCursor),
  };
}

// ── Response helpers ───────────────────────────────────────────────────────

/**
 * Build a paginated JSON response.
 *
 * Pass `items` as the full page (exactly `limit` items if there are more, or
 * fewer on the last page).  Pass `total` fetched from the DB query as
 * `limit + 1` — the extra record is used to detect whether another page
 * exists (and is then sliced off before returning).
 *
 * @param allItems   Items fetched with `limit + 1` to detect next page.
 * @param limit      The effective page size requested.
 * @param getIdAndTs Function to extract `{ id, ts }` from the last item.
 */
export function buildPaginatedResponse<T>(
  allItems: T[],
  limit: number,
  getIdAndTs: (item: T) => { id: string; ts: number },
): PaginatedResult<T> {
  const hasMore = allItems.length > limit;
  const data = hasMore ? allItems.slice(0, limit) : allItems;
  const lastItem = data[data.length - 1];
  const nextCursor =
    hasMore && lastItem ? encodeCursor(...Object.values(getIdAndTs(lastItem)) as [string, number]) : null;

  return {
    data,
    pagination: { limit, nextCursor, hasMore },
  };
}

/**
 * Wrap a `PaginatedResult` in a `NextResponse`.
 */
export function paginatedResponse<T>(result: PaginatedResult<T>, status = 200): NextResponse {
  return NextResponse.json(result, { status });
}

// ── Offset-backed convenience ──────────────────────────────────────────────

/**
 * Convert a cursor (or null/undefined for first page) to a numeric DB offset.
 * Use this for endpoints backed by offset/limit queries that cannot be
 * immediately migrated to keyset pagination.
 */
export function cursorToOffset(cursor: string | null | undefined): number {
  return decodeOffsetCursor(cursor);
}

/**
 * Build a `nextCursor` from the current offset + page size.
 * Returns null when `itemCount < limit` (last page).
 */
export function nextOffsetCursor(offset: number, limit: number, itemCount: number): string | null {
  if (itemCount < limit) return null;
  return encodeOffsetCursor(offset + limit);
}
