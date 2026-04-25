/**
 * Transaction timeout detection, cancellation, and refund triggering.
 *
 * A transaction is considered timed out if it has been in 'pending' status
 * for longer than TRANSACTION_TIMEOUT_MS without completing.
 */
import { dal } from '@/lib/db/dal';
import type { Transaction } from '@/lib/transaction-storage';
import { processRefund } from '@/lib/refund/refund-service';
import { notifyTransactionStatusUpdate } from '@/lib/notifications/service';

/** Transactions pending longer than this are considered timed out (30 minutes) */
export const TRANSACTION_TIMEOUT_MS = 30 * 60 * 1000;

export interface TimeoutCheckResult {
  transactionId: string;
  timedOut: boolean;
  ageMs: number;
  cancelled: boolean;
  refundTriggered: boolean;
  error?: string;
}

/**
 * Returns true if the transaction has exceeded the timeout threshold.
 */
export function isTransactionTimedOut(tx: Transaction, nowMs = Date.now()): boolean {
  if (tx.status !== 'pending') return false;
  return nowMs - tx.timestamp > TRANSACTION_TIMEOUT_MS;
}

/**
 * Cancels a timed-out transaction: marks it failed and triggers a refund.
 */
export async function cancelTimedOutTransaction(
  transactionId: string
): Promise<TimeoutCheckResult> {
  const now = Date.now();
  let tx: Transaction | null;

  try {
    tx = await dal.getById(transactionId);
  } catch (err) {
    return { transactionId, timedOut: false, ageMs: 0, cancelled: false, refundTriggered: false, error: String(err) };
  }

  if (!tx) {
    return { transactionId, timedOut: false, ageMs: 0, cancelled: false, refundTriggered: false, error: 'Transaction not found' };
  }

  const ageMs = now - tx.timestamp;

  if (!isTransactionTimedOut(tx, now)) {
    return { transactionId, timedOut: false, ageMs, cancelled: false, refundTriggered: false };
  }

  logTimeoutEvent(transactionId, tx.userAddress, ageMs);

  // Mark as failed/cancelled
  try {
    await dal.update(transactionId, { status: 'failed', error: 'Transaction timed out' });
    const updated = await dal.getById(transactionId);
    if (updated) {
      await notifyTransactionStatusUpdate({
        transaction: updated,
        previousStatus: tx.status,
        previousPayoutStatus: tx.payoutStatus,
        source: 'timeout',
      });
    }
  } catch (err) {
    return { transactionId, timedOut: true, ageMs, cancelled: false, refundTriggered: false, error: String(err) };
  }

  // Trigger refund
  const refundResult = await processRefund(transactionId, 'timeout');

  return {
    transactionId,
    timedOut: true,
    ageMs,
    cancelled: true,
    refundTriggered: refundResult.success,
    error: refundResult.success ? undefined : refundResult.error,
  };
}

/**
 * Checks all pending transactions for a user and cancels timed-out ones.
 */
export async function checkAndCancelTimedOutTransactions(
  userAddress: string
): Promise<TimeoutCheckResult[]> {
  let transactions: Transaction[];
  try {
    transactions = await dal.getByUser(userAddress);
  } catch {
    return [];
  }

  const pending = transactions.filter((tx) => tx.status === 'pending');
  const results = await Promise.all(
    pending.map((tx) => cancelTimedOutTransaction(tx.id))
  );
  return results.filter((r) => r.timedOut);
}

/** Structured log for timeout events */
function logTimeoutEvent(transactionId: string, userAddress: string, ageMs: number): void {
  console.warn(JSON.stringify({
    event: 'transaction.timeout',
    transactionId,
    userAddress,
    ageMs,
    timestamp: new Date().toISOString(),
  }));
}
