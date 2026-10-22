/**
 * Tests for the db-reset helpers (issue #1349).
 *
 * Verifies that:
 *  - resetDb() clears all tables
 *  - resetTables() clears only the specified tables
 *  - seedTable() inserts rows accessible via getRows()
 *  - getDbMock() returns a vi.fn() that can be installed in vi.mock()
 *  - Tests run correctly in any order (no inter-test row leakage)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetDb,
  resetTables,
  seedTable,
  getRows,
  getDbMock,
  dbState,
  ALL_TABLES,
} from './db-reset';

describe('db-reset helpers (#1349)', () => {
  // Always start clean
  beforeEach(() => {
    resetDb();
  });

  // ── resetDb ──────────────────────────────────────────────────────────────

  describe('resetDb()', () => {
    it('clears all tables to empty arrays', () => {
      // Seed a few tables with fake rows
      seedTable('transactions', [{ id: 'tx-1' }, { id: 'tx-2' }]);
      seedTable('api_keys', [{ id: 'key-1' }]);
      seedTable('ledger_entries', [{ id: 'entry-1' }]);

      resetDb();

      for (const table of ALL_TABLES) {
        expect(getRows(table)).toHaveLength(0);
      }
    });

    it('is idempotent — calling twice does not throw', () => {
      expect(() => {
        resetDb();
        resetDb();
      }).not.toThrow();
    });

    it('allows re-seeding after reset', () => {
      seedTable('transactions', [{ id: 'tx-a' }]);
      resetDb();
      seedTable('transactions', [{ id: 'tx-b' }]);

      const rows = getRows('transactions');
      expect(rows).toHaveLength(1);
      expect((rows[0] as { id: string }).id).toBe('tx-b');
    });
  });

  // ── resetTables ───────────────────────────────────────────────────────────

  describe('resetTables()', () => {
    it('only clears the listed tables', () => {
      seedTable('transactions', [{ id: 'tx-keep' }]);
      seedTable('api_keys', [{ id: 'key-clear' }]);

      resetTables(['api_keys']);

      expect(getRows('transactions')).toHaveLength(1);
      expect(getRows('api_keys')).toHaveLength(0);
    });

    it('accepts multiple tables at once', () => {
      seedTable('transactions', [{ id: 'tx-1' }]);
      seedTable('idempotency_keys', [{ id: 'idem-1' }]);
      seedTable('audit_log', [{ id: 'log-1' }]);

      resetTables(['transactions', 'idempotency_keys']);

      expect(getRows('transactions')).toHaveLength(0);
      expect(getRows('idempotency_keys')).toHaveLength(0);
      // audit_log was NOT in the list — should still have its row
      expect(getRows('audit_log')).toHaveLength(1);
    });

    it('handles an empty list without throwing', () => {
      seedTable('transactions', [{ id: 'tx-safe' }]);
      expect(() => resetTables([])).not.toThrow();
      expect(getRows('transactions')).toHaveLength(1);
    });
  });

  // ── seedTable / getRows ───────────────────────────────────────────────────

  describe('seedTable() / getRows()', () => {
    it('inserts rows that getRows() returns', () => {
      const fixture = [
        { id: 'tx-001', amount: '100.00', currency: 'USDC' },
        { id: 'tx-002', amount: '200.00', currency: 'USDC' },
      ];

      seedTable('transactions', fixture);

      const rows = getRows<{ id: string; amount: string }>('transactions');
      expect(rows).toHaveLength(2);
      expect(rows[0].id).toBe('tx-001');
      expect(rows[1].amount).toBe('200.00');
    });

    it('accumulates rows across multiple seedTable() calls', () => {
      seedTable('transactions', [{ id: 'tx-a' }]);
      seedTable('transactions', [{ id: 'tx-b' }]);

      expect(getRows('transactions')).toHaveLength(2);
    });

    it('returns an empty array for a table that was never seeded', () => {
      expect(getRows('reconciliation_history')).toEqual([]);
    });

    it('does not share rows between different tables', () => {
      seedTable('transactions', [{ id: 'tx-isolated' }]);
      expect(getRows('api_keys')).toHaveLength(0);
    });
  });

  // ── getDbMock ─────────────────────────────────────────────────────────────

  describe('getDbMock()', () => {
    it('returns a vi.fn()', () => {
      const mock = getDbMock();
      expect(typeof mock).toBe('function');
      expect(mock.mock).toBeDefined();
    });

    it('resolves with { rows: [] } by default', async () => {
      const mock = getDbMock();
      const result = await mock('SELECT 1');
      expect(result).toEqual({ rows: [] });
    });

    it('call history is cleared by resetDb()', async () => {
      const mock = getDbMock();
      await mock('SELECT 1');
      await mock('SELECT 2');
      expect(mock.mock.calls).toHaveLength(2);

      resetDb();
      expect(mock.mock.calls).toHaveLength(0);
    });
  });

  // ── Test order independence ───────────────────────────────────────────────

  describe('order independence', () => {
    it('test A: seeds rows and reads them back', () => {
      seedTable('transactions', [{ id: 'order-a' }]);
      expect(getRows('transactions')).toHaveLength(1);
    });

    it('test B: starts empty even if test A ran first', () => {
      // beforeEach calls resetDb(), so this should always be empty
      expect(getRows('transactions')).toHaveLength(0);
    });

    it('test C: seeds different data independently', () => {
      seedTable('api_keys', [{ id: 'key-c1' }, { id: 'key-c2' }]);
      expect(getRows('transactions')).toHaveLength(0);
      expect(getRows('api_keys')).toHaveLength(2);
    });
  });

  // ── dbState direct access ─────────────────────────────────────────────────

  describe('dbState direct access', () => {
    it('is the same object mutated by seedTable()', () => {
      seedTable('transactions', [{ id: 'direct' }]);
      expect(dbState['transactions']).toHaveLength(1);
    });

    it('reflects resets', () => {
      seedTable('audit_log', [{ id: 'log-direct' }]);
      resetDb();
      expect(dbState['audit_log']).toHaveLength(0);
    });
  });
});
