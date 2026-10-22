import { getSharedPoolStats } from './client';

export interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

/**
 * Read-only view over the single shared pool owned by `./client`.
 *
 * This used to create its own `pg.Pool` per connection string, duplicating the
 * pool in `client.ts`. Every query now goes through that one pool, so this
 * manager only reports its statistics.
 */
export class ConnectionPoolManager {
  /** Statistics for the shared pool. */
  getPoolStats(): PoolStats {
    return getSharedPoolStats();
  }

  /** Statistics keyed by pool name. There is one pool, named `default`. */
  getAllPoolStats(): Record<string, PoolStats> {
    return { default: getSharedPoolStats() };
  }
}

export const connectionPoolManager = new ConnectionPoolManager();
