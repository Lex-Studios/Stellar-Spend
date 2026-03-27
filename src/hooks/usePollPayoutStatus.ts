'use client';

import { useCallback } from 'react';
import type { PayoutStatus } from '@/lib/offramp/types';
import { TransactionStorage } from '@/lib/transaction-storage';

const POLL_INTERVAL_MS = 10_000;
const MAX_ATTEMPTS = 60;

const TERMINAL_STATES: PayoutStatus[] = ['validated', 'settled', 'refunded', 'expired'];

interface PollPayoutStatusOptions {
  transactionId: string;
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

        const res = await fetch(`/api/offramp/status/${orderId}`, { cache: 'no-store' });
        const data: { status?: PayoutStatus; error?: string } = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? 'Failed to fetch payout status');
        }

        const status = data.status;

        // Persist each poll result
        TransactionStorage.update(transactionId, { payoutStatus: status });

        if (status && TERMINAL_STATES.includes(status)) {
          if (status === 'validated' || status === 'settled') {
            onSettling?.();
            return;
          }
          // refunded or expired
          throw new Error(
            status === 'refunded'
              ? 'Payout was refunded. Please contact support.'
              : 'Payout order expired. Please try again.'
          );
        }

        // Not terminal — wait before next attempt
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
