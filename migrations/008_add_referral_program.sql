CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  reward_amount DECIMAL(20, 8) NOT NULL,
  claimed_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id VARCHAR(255) NOT NULL,
  referred_user_id VARCHAR(255) NOT NULL,
  referral_code VARCHAR(20) NOT NULL,
  reward_amount DECIMAL(20, 8) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referral_code ON referral_codes(code);
CREATE INDEX idx_referral_user_id ON referral_codes(user_id);
CREATE INDEX idx_referral_rewards_referrer ON referral_rewards(referrer_id);
