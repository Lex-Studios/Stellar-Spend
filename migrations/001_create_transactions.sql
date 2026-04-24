-- Migration: 001_create_transactions
-- Creates the transactions table and supporting indexes.
-- Idempotent: safe to run multiple times (uses IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS transactions (
  id                              TEXT PRIMARY KEY,
  timestamp                       BIGINT NOT NULL,
  user_address                    TEXT NOT NULL,
  amount                          TEXT NOT NULL,
  currency                        TEXT NOT NULL,
  stellar_tx_hash                 TEXT,
  bridge_status                   TEXT,
  payout_order_id                 TEXT,
  payout_status                   TEXT,
  beneficiary_institution         TEXT NOT NULL,
  beneficiary_account_identifier  TEXT NOT NULL,
  beneficiary_account_name        TEXT NOT NULL,
  beneficiary_currency            TEXT NOT NULL,
  status                          TEXT NOT NULL,
  error                           TEXT,
  CONSTRAINT transactions_status_check CHECK (status IN ('pending', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_address_timestamp
  ON transactions (user_address, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_payout_order_id
  ON transactions (payout_order_id);
