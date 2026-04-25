import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isTransactionTimedOut, cancelTimedOutTransaction, TRANSACTION_TIMEOUT_MS } from './transaction-timeout';
import type { Transaction } from './transaction-storage';

vi.mock('@/lib/db/dal', () => ({
  dal: {
    getById: vi.fn(),
    update: vi.fn(),
    getByUser: vi.fn(),
  },
  DatabaseError: class DatabaseError extends Error {},
}));

vi.mock('@/lib/refund/refund-service', () => ({
  processRefund: vi.fn().mockResolvedValue({ success: true, refundAmount: '100', reason: 'timeout', timestamp: new Date().toISOString() }),
}));

vi.mock('@/lib/notifications/service', () => ({
  notifyTransactionStatusUpdate: vi.fn().mockResolvedValue(undefined),
}));

import { dal } from '@/lib/db/dal';

const now = Date.now();
const pendingTx: Transaction = {
  id: 'tx_timeout',
  timestamp: now - TRANSACTION_TIMEOUT_MS - 1000, // just past timeout
  userAddress: '0xabc',
  amount: '50',
  currency: 'NGN',
  status: 'pending',
  beneficiary: { institution: 'GTB', accountIdentifier: '1234567890', accountName: 'Jane', currency: 'NGN' },
};

describe('isTransactionTimedOut', () => {
  it('returns true for pending tx past timeout', () => {
    expect(isTransactionTimedOut(pendingTx, now)).toBe(true);
  });

  it('returns false for pending tx within timeout', () => {
    const fresh = { ...pendingTx, timestamp: now - 1000 };
    expect(isTransactionTimedOut(fresh, now)).toBe(false);
  });

  it('returns false for completed tx', () => {
    const completed = { ...pendingTx, status: 'completed' as const };
    expect(isTransactionTimedOut(completed, now)).toBe(false);
  });
});

describe('cancelTimedOutTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns not timed out for fresh transaction', async () => {
    const fresh = { ...pendingTx, timestamp: now - 1000 };
    vi.mocked(dal.getById).mockResolvedValue(fresh);
    const result = await cancelTimedOutTransaction('tx_timeout');
    expect(result.timedOut).toBe(false);
    expect(result.cancelled).toBe(false);
  });

  it('cancels and triggers refund for timed-out transaction', async () => {
    vi.mocked(dal.getById).mockResolvedValue(pendingTx);
    vi.mocked(dal.update).mockResolvedValue(undefined);
    const result = await cancelTimedOutTransaction('tx_timeout');
    expect(result.timedOut).toBe(true);
    expect(result.cancelled).toBe(true);
    expect(result.refundTriggered).toBe(true);
    expect(dal.update).toHaveBeenCalledWith('tx_timeout', expect.objectContaining({ status: 'failed' }));
  });

  it('returns error if transaction not found', async () => {
    vi.mocked(dal.getById).mockResolvedValue(null);
    const result = await cancelTimedOutTransaction('tx_missing');
    expect(result.timedOut).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });
});
