import { describe, it, expect, vi, beforeEach } from 'vitest';

const poolCtor = vi.hoisted(() => vi.fn());

vi.mock('pg', () => ({
  Pool: poolCtor,
}));

vi.mock('../client', () => ({
  getSharedPoolStats: () => ({ totalCount: 4, idleCount: 1, waitingCount: 0 }),
}));

import { ConnectionPoolManager, connectionPoolManager } from '../connection-pool';

describe('ConnectionPoolManager', () => {
  beforeEach(() => {
    poolCtor.mockClear();
  });

  it('does not create a second pg.Pool', () => {
    const manager = new ConnectionPoolManager();
    manager.getPoolStats();
    manager.getAllPoolStats();
    expect(poolCtor).not.toHaveBeenCalled();
  });

  it('reports the shared pool stats', () => {
    expect(connectionPoolManager.getPoolStats()).toEqual({
      totalCount: 4,
      idleCount: 1,
      waitingCount: 0,
    });
  });

  it('exposes the shared pool under the default key', () => {
    expect(connectionPoolManager.getAllPoolStats()).toEqual({
      default: { totalCount: 4, idleCount: 1, waitingCount: 0 },
    });
  });
});
