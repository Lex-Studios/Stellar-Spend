export interface PaginationParams {
  cursor?: string | null;
  limit?: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Decode a cursor to get the offset.
 * Cursor is a base64-encoded offset value.
 */
export function decodeCursor(cursor?: string | null): number {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const offset = parseInt(decoded, 10);
    return Number.isFinite(offset) && offset >= 0 ? offset : 0;
  } catch {
    return 0;
  }
}

/**
 * Encode an offset to create a cursor.
 * Cursor is a base64-encoded offset value.
 */
export function encodeCursor(offset: number): string {
  return Buffer.from(offset.toString(), 'utf-8').toString('base64');
}

/**
 * Create a paginated response with cursor for the next page.
 * Returns `null` cursor if there are no more items.
 */
export function createPaginatedResponse<T>(
  data: T[],
  cursor: number,
  limit: number,
  totalAvailable: number,
): PaginationResponse<T> {
  const hasMore = cursor + limit < totalAvailable;
  const nextCursor = hasMore ? encodeCursor(cursor + limit) : undefined;

  return {
    data,
    pagination: {
      cursor: nextCursor,
      hasMore,
      limit,
    },
  };
}

export interface ParsedPaginationQuery {
  cursor: string | null;
  offset: number;
  limit: number;
}

/**
 * Parse `cursor` and `limit` from a query string.
 * Invalid or missing limits fall back to `defaultLimit` and are clamped to `[1, maxLimit]`.
 */
export function parsePaginationQuery(
  searchParams: URLSearchParams,
  options: { defaultLimit: number; maxLimit: number },
): ParsedPaginationQuery {
  const cursor = searchParams.get('cursor');
  const parsed = parseInt(searchParams.get('limit') ?? '', 10);
  const requested = Number.isFinite(parsed) ? parsed : options.defaultLimit;
  const limit = Math.min(Math.max(requested, 1), options.maxLimit);
  return { cursor, offset: decodeCursor(cursor), limit };
}

/**
 * Trim a result fetched with a `limit + 1` lookahead back to `limit` items
 * and report whether more items exist beyond the page.
 */
export function trimLookahead<T>(items: T[], limit: number): { data: T[]; hasMore: boolean } {
  const hasMore = items.length > limit;
  return { data: hasMore ? items.slice(0, limit) : items, hasMore };
}
