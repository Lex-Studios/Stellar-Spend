CREATE TABLE transaction_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(20, 8) NOT NULL,
  completed_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE batch_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES transaction_batches(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_batch_user_id ON transaction_batches(user_id);
CREATE INDEX idx_batch_status ON transaction_batches(status);
CREATE INDEX idx_batch_transactions_batch_id ON batch_transactions(batch_id);
