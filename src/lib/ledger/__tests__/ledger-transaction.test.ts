import { describe, expect, it, vi, beforeEach } from 'vitest';

const clientQuery = vi.hoisted(() => vi.fn());
const release = vi.hoisted(() => vi.fn());

vi.mock('@/lib/db/client', () => ({
  pool: {
    query: vi.fn(),
    connect: async () => ({ query: clientQuery, release }),
  },
}));

import { recordDoubleEntry, LedgerError } from '../entries';

const debit = {
  transactionId: 'tx_9',
  accountId: 'asset_fees_receivable',
  amount: '1.00',
  currency: 'USD',
  referenceType: 'transaction',
  referenceId: 'tx_9',
};
const credit = { ...debit, accountId: 'revenue_fees' };

const entryRow = (type: 'debit' | 'credit') => ({
  id: `${type}-id`,
  transaction_id: 'tx_9',
  account_id: type === 'debit' ? debit.accountId : credit.accountId,
  entry_type: type,
  amount: '1.00',
  currency: 'USD',
  description: null,
  reference_type: 'transaction',
  reference_id: 'tx_9',
  entry_hash: `${type}-hash`,
  created_at: Date.now(),
});

describe('recordDoubleEntry transactional boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('commits both rows in one transaction on success', async () => {
    clientQuery.mockImplementation(async (sql: string) => {
      if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [] };
      if (sql.includes('INSERT INTO ledger_entries')) {
        return { rows: [entryRow(clientQuery.mock.calls.length === 2 ? 'debit' : 'credit')] };
      }
      return { rows: [] };
    });

    const [d, c] = await recordDoubleEntry(debit, credit);

    expect(d.entryType).toBe('debit');
    expect(c.entryType).toBe('credit');
    const statements = clientQuery.mock.calls.map((call) => call[0]);
    expect(statements[0]).toBe('BEGIN');
    expect(statements[statements.length - 1]).toBe('COMMIT');
    expect(statements).not.toContain('ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('rolls back the debit when the credit insert fails', async () => {
    let inserts = 0;
    clientQuery.mockImplementation(async (sql: string) => {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] };
      if (sql.includes('INSERT INTO ledger_entries')) {
        inserts++;
        if (inserts === 2) throw new Error('connection reset');
        return { rows: [entryRow('debit')] };
      }
      return { rows: [] };
    });

    await expect(recordDoubleEntry(debit, credit)).rejects.toBeInstanceOf(LedgerError);

    const statements = clientQuery.mock.calls.map((call) => call[0]);
    expect(statements).toContain('ROLLBACK');
    expect(statements).not.toContain('COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
