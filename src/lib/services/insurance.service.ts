import { db } from '@/lib/db/client';

export interface InsuranceQuote {
  premium: number;
  coverage: number;
  provider: string;
}

export async function calculateInsurancePremium(
  amount: number,
  currency: string
): Promise<InsuranceQuote> {
  const premiumRate = 0.005; // 0.5% premium
  const premium = amount * premiumRate;
  const coverage = amount * 1.1; // 110% coverage

  return {
    premium,
    coverage,
    provider: 'default',
  };
}

export async function createInsurance(
  transactionId: string,
  premium: number,
  coverage: number,
  provider: string
) {
  return db.query(
    `INSERT INTO transaction_insurance (transaction_id, premium_amount, coverage_amount, provider, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING *`,
    [transactionId, premium, coverage, provider]
  );
}

export async function getInsuranceStatus(transactionId: string) {
  return db.query(
    `SELECT * FROM transaction_insurance WHERE transaction_id = $1`,
    [transactionId]
  );
}

export async function fileClaim(insuranceId: string, reason: string) {
  const claimId = `CLAIM-${Date.now()}`;
  return db.query(
    `UPDATE transaction_insurance SET status = 'claimed', claim_id = $1 WHERE id = $2 RETURNING *`,
    [claimId, insuranceId]
  );
}
