-- Migration: 002_add_transaction_analytics_fields
-- Adds analytics-oriented transaction fields.
-- Idempotent: safe to run multiple times.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS finalized_at BIGINT,
  ADD COLUMN IF NOT EXISTS fee_method TEXT,
  ADD COLUMN IF NOT EXISTS bridge_fee TEXT,
  ADD COLUMN IF NOT EXISTS network_fee TEXT,
  ADD COLUMN IF NOT EXISTS paycrest_fee TEXT,
  ADD COLUMN IF NOT EXISTS total_fee TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transactions_fee_method_check'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_fee_method_check
      CHECK (fee_method IS NULL OR fee_method IN ('native', 'stablecoin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_timestamp
  ON transactions (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_finalized_at
  ON transactions (finalized_at DESC);
