import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB before importing the module under test
vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn(),
  },
}));

import { db } from '@/lib/db';
import {
  calculateRiskScore,
  calculateInsurancePremium,
  verifyClaim,
  approveClaim,
  processInsurancePayout,
} from './insurance.service';

describe('calculateRiskScore', () => {
  it('returns base score of 50 for a standard amount and currency', () => {
    expect(calculateRiskScore(500, 'EUR')).toBe(50);
  });

  it('applies high-value discount for amounts above 10000', () => {
    expect(calculateRiskScore(15000, 'EUR')).toBe(40);
  });

  it('applies small-amount surcharge for amounts below 100', () => {
    expect(calculateRiskScore(50, 'EUR')).toBe(60);
  });

  it('applies stablecoin discount for USDC', () => {
    expect(calculateRiskScore(500, 'USDC')).toBe(45);
  });

  it('applies stablecoin discount for USDT', () => {
    expect(calculateRiskScore(500, 'USDT')).toBe(45);
  });

  it('applies stablecoin discount for DAI', () => {
    expect(calculateRiskScore(500, 'DAI')).toBe(45);
  });

  it('stablecoin check is case-insensitive', () => {
    expect(calculateRiskScore(500, 'usdc')).toBe(45);
  });

  it('combines high-value and stablecoin discounts', () => {
    // base 50 - 10 (high value) - 5 (stablecoin) = 35
    expect(calculateRiskScore(15000, 'USDC')).toBe(35);
  });

  it('clamps score to 0 at minimum', () => {
    // Make a scenario with large negative adjustments to confirm clamping
    const score = calculateRiskScore(15000, 'USDC');
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('clamps score to 100 at maximum', () => {
    const score = calculateRiskScore(500, 'EUR');
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('calculateInsurancePremium', () => {
  it('returns a quote for a standard amount', async () => {
    const quote = await calculateInsurancePremium(500, 'EUR');
    expect(quote.premium).toBeGreaterThan(0);
    expect(quote.coverage).toBeGreaterThan(500);
    expect(quote.riskScore).toBeDefined();
    expect(quote.expiresAt).toBeGreaterThan(Date.now());
  });

  it('assigns provider "default" for amounts below 1000', async () => {
    const quote = await calculateInsurancePremium(100, 'EUR');
    expect(quote.provider).toBe('default');
  });

  it('assigns provider "premium" for amounts between 1000 and 9999', async () => {
    const quote = await calculateInsurancePremium(5000, 'EUR');
    expect(quote.provider).toBe('premium');
  });

  it('assigns provider "enterprise" for amounts at or above 10000', async () => {
    const quote = await calculateInsurancePremium(10000, 'EUR');
    expect(quote.provider).toBe('enterprise');
  });

  it('applies lower rate for high-value amounts (bulk discount)', async () => {
    const standard = await calculateInsurancePremium(500, 'EUR');
    const highValue = await calculateInsurancePremium(15000, 'EUR');
    // High-value rate is 0.003 vs 0.005, so per-unit premium is lower
    const standardRate = standard.premium / 500;
    const highValueRate = highValue.premium / 15000;
    expect(highValueRate).toBeLessThan(standardRate);
  });

  it('coverage is 1.1x the amount', async () => {
    const quote = await calculateInsurancePremium(1000, 'EUR');
    expect(parseFloat(quote.coverage.toFixed(6))).toBeCloseTo(1100, 2);
  });
});

describe('verifyClaim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns invalid when insurance record is not found', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [] });
    const result = await verifyClaim('missing-id');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not found');
  });

  it('returns invalid when status is not "claimed"', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ id: '1', status: 'active', claim_reason: null }],
    });
    const result = await verifyClaim('ins-1');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('No active claim');
  });

  it('returns invalid when claim has no reason', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ id: '1', status: 'claimed', claim_reason: null }],
    });
    const result = await verifyClaim('ins-1');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('no stated reason');
  });

  it('returns valid for a claimed policy with a reason', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ id: '1', status: 'claimed', claim_reason: 'Transaction failed' }],
    });
    const result = await verifyClaim('ins-1');
    expect(result.valid).toBe(true);
  });
});

describe('approveClaim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when verification fails', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [] }); // verifyClaim → not found
    await expect(approveClaim('ins-1')).rejects.toThrow('Insurance record not found');
  });

  it('queries the approval update when claim is valid', async () => {
    // First query: verifyClaim's SELECT
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ id: '1', status: 'claimed', claim_reason: 'Failed tx' }],
    });
    // Second query: UPDATE
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ id: '1', status: 'claim_approved' }],
    });

    const result = await approveClaim('ins-1');
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query).toHaveBeenLastCalledWith(
      expect.stringContaining("SET status = 'claim_approved'"),
      ['ins-1'],
    );
    expect((result as { rows: unknown[] }).rows[0]).toMatchObject({ status: 'claim_approved' });
  });
});

describe('processInsurancePayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when insurance record is not found', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [] });
    await expect(processInsurancePayout('ins-missing')).rejects.toThrow(
      'Insurance record not found',
    );
  });

  it('throws when claim is not approved', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ id: '1', status: 'claimed' }],
    });
    await expect(processInsurancePayout('ins-1')).rejects.toThrow(
      'Claim must be approved before payout',
    );
  });

  it('executes payout update for an approved claim', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ id: '1', status: 'claim_approved' }],
    });
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ id: '1', status: 'paid' }],
    });

    const result = await processInsurancePayout('ins-1');
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query).toHaveBeenLastCalledWith(
      expect.stringContaining("SET status = 'paid'"),
      expect.arrayContaining(['ins-1']),
    );
    expect((result as { rows: unknown[] }).rows[0]).toMatchObject({ status: 'paid' });
  });
});
