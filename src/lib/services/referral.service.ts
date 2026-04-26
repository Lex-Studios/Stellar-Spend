import { db } from '@/lib/db/client';
import crypto from 'crypto';

export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  rewardAmount: number;
  claimedCount: number;
}

function generateReferralCode(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase().slice(0, 10);
}

export async function createReferralCode(
  userId: string,
  rewardAmount: number = 5
) {
  const code = generateReferralCode();
  const result = await db.query(
    `INSERT INTO referral_codes (user_id, code, reward_amount)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, code, rewardAmount]
  );
  return result.rows[0];
}

export async function getReferralCode(userId: string) {
  const result = await db.query(
    `SELECT * FROM referral_codes WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

export async function trackReferral(
  referralCode: string,
  referredUserId: string
) {
  const codeRecord = await db.query(
    `SELECT * FROM referral_codes WHERE code = $1`,
    [referralCode]
  );

  if (!codeRecord.rows[0]) {
    throw new Error('Invalid referral code');
  }

  const referrerId = codeRecord.rows[0].user_id;
  const rewardAmount = codeRecord.rows[0].reward_amount;

  const result = await db.query(
    `INSERT INTO referral_rewards (referrer_id, referred_user_id, referral_code, reward_amount, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [referrerId, referredUserId, referralCode, rewardAmount]
  );

  await db.query(
    `UPDATE referral_codes SET claimed_count = claimed_count + 1 WHERE code = $1`,
    [referralCode]
  );

  return result.rows[0];
}

export async function getReferralStats(userId: string) {
  const rewards = await db.query(
    `SELECT COUNT(*) as total_referrals, SUM(reward_amount) as total_rewards
     FROM referral_rewards WHERE referrer_id = $1 AND status = 'completed'`,
    [userId]
  );
  return rewards.rows[0];
}
