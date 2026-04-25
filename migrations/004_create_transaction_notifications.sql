-- Migration: 004_create_transaction_notifications
-- Adds notification preferences and delivery tracking for transaction updates.
-- Idempotent: safe to run multiple times.

CREATE TABLE IF NOT EXISTS transaction_notification_preferences (
  user_address        TEXT PRIMARY KEY,
  email               TEXT,
  phone_number        TEXT,
  email_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  notify_on_pending   BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_completed BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_failed    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          BIGINT NOT NULL,
  updated_at          BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS transaction_notification_deliveries (
  id                  TEXT PRIMARY KEY,
  transaction_id      TEXT NOT NULL,
  user_address        TEXT NOT NULL,
  event_type          TEXT NOT NULL,
  channel             TEXT NOT NULL,
  destination         TEXT,
  status              TEXT NOT NULL,
  template_id         TEXT NOT NULL,
  subject             TEXT,
  message             TEXT NOT NULL,
  provider_message_id TEXT,
  error_message       TEXT,
  attempt_count       INTEGER NOT NULL DEFAULT 1,
  metadata            JSONB,
  created_at          BIGINT NOT NULL,
  updated_at          BIGINT NOT NULL,
  sent_at             BIGINT,
  CONSTRAINT transaction_notification_deliveries_channel_check
    CHECK (channel IN ('email', 'sms')),
  CONSTRAINT transaction_notification_deliveries_status_check
    CHECK (status IN ('sent', 'failed', 'skipped'))
);

CREATE INDEX IF NOT EXISTS idx_transaction_notification_deliveries_transaction_id
  ON transaction_notification_deliveries (transaction_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transaction_notification_deliveries_user_address
  ON transaction_notification_deliveries (user_address, created_at DESC);
