-- Migration: 003_create_idempotency_keys
-- Stores API idempotency records for safe retries.
-- Idempotent: safe to run multiple times.

CREATE TABLE IF NOT EXISTS idempotency_keys (
  idempotency_key TEXT NOT NULL,
  method          TEXT NOT NULL,
  path            TEXT NOT NULL,
  request_hash    TEXT NOT NULL,
  status          TEXT NOT NULL,
  status_code     INTEGER,
  response_body   JSONB,
  response_headers JSONB,
  locked_until    BIGINT,
  created_at      BIGINT NOT NULL,
  updated_at      BIGINT NOT NULL,
  expires_at      BIGINT NOT NULL,
  PRIMARY KEY (idempotency_key, method, path),
  CONSTRAINT idempotency_status_check CHECK (status IN ('processing', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at
  ON idempotency_keys (expires_at);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_status_locked_until
  ON idempotency_keys (status, locked_until);
