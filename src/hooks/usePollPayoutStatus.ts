'use client';

import { useCallback } from 'react';
import type { PayoutStatus } from '@/lib/offramp/types';
import { TransactionStorage } from '@/lib/transaction-storage';
import type { OfframpStep } from '@/types/stellaramp';

const POLL_INTERVAL_MS = 10_000;
const MAX_ATTEMPTS = 60;

const TERMINAL_STATES: PayoutStatus[] = ['validated', 'settled', 'refunded', 'expired'];

interface PollPayoutStatusOptions {
  transactionId: string;
  onStepChange: (step: OfframpStep) => void;
  onSettling?: () => void;
}

/**
 * Polls GET /api/offramp/status/{orderId} every 10 s, up to 60 attempts (10 min).
 * - "validated" | "settled"  → calls onSettling(), resolves
 * - "refunded" | "expired"   → rejects with descriptive error
 * - Timeout                  → rejects with "Payout polling timeout"
 * Updates TransactionStorage on every poll.
 */
export function usePollPayoutStatus() {
  const pollPayoutStatus = useCallback(
    async (orderId: string, { transactionId, onSettling }: PollPayoutStatusOptions): Promise<void> => {
      let attempts = 0;

      while (attempts < MAX_ATTEMPTS) {
        attempts++;

        try {
          const res = await fetch(`/api/offramp/status/${orderId}`, { cache: 'no-store' });
          const data: { status?: PayoutStatus; error?: string } = await res.json();

          if (res.ok && data.status) {
            TransactionStorage.update(transactionId, { payoutStatus: data.status });

            if (data.status === 'validated' || data.status === 'settled') {
              onStepChange('settling');
              return;
            }

            if (data.status === 'refunded') {
              throw new Error('Payout was refunded. Please contact support.');
            }

            if (data.status === 'expired') {
              throw new Error('Payout order expired. Please try again.');
            }
          }
        } catch (err: unknown) {
          // Re-throw terminal errors; swallow transient HTTP errors
          if (err instanceof Error && TERMINAL_STATES.some((s) => err.message.includes(s))) {
            throw err;
          }
          if (err instanceof Error && (err.message.includes('refunded') || err.message.includes('expired'))) {
            throw err;
          }
        }

        if (attempts < MAX_ATTEMPTS) {
          await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }
      }

      throw new Error('Payout polling timeout');
    },
    []
  );

  return { pollPayoutStatus };
}
