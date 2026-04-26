CREATE TABLE transaction_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  premium_amount DECIMAL(20, 8) NOT NULL,
  coverage_amount DECIMAL(20, 8) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  claim_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_insurance_transaction_id ON transaction_insurance(transaction_id);
CREATE INDEX idx_insurance_status ON transaction_insurance(status);
