import type {
  NotificationContext,
  NotificationTemplate,
  TransactionNotificationEvent,
} from '@/lib/notifications/types';

function amountLabel(amount: string, currency: string): string {
  return `${amount} ${currency}`;
}

function baseMessage(context: NotificationContext): string {
  const tx = context.transaction;
  const beneficiary = tx.beneficiary.accountName || tx.beneficiary.accountIdentifier;
  return `Transaction ${tx.id} for ${amountLabel(tx.amount, tx.currency)} to ${beneficiary}.`;
}

export function deriveNotificationEvent(context: NotificationContext): TransactionNotificationEvent | null {
  const current = context.transaction.status;
  if (current === context.previousStatus && context.transaction.payoutStatus === context.previousPayoutStatus) {
    return null;
  }
  if (current === 'completed') return 'completed';
  if (current === 'failed') return 'failed';
  if (current === 'pending' && context.transaction.payoutStatus === 'pending') return 'pending';
  return null;
}

export function buildNotificationTemplate(context: NotificationContext): NotificationTemplate | null {
  const event = deriveNotificationEvent(context);
  if (!event) return null;

  if (event === 'completed') {
    return {
      templateId: 'transaction-completed-v1',
      subject: `Transaction completed: ${context.transaction.id}`,
      message: `${baseMessage(context)} Status: completed. Your payout has been settled successfully.`,
    };
  }

  if (event === 'failed') {
    return {
      templateId: 'transaction-failed-v1',
      subject: `Transaction failed: ${context.transaction.id}`,
      message: `${baseMessage(context)} Status: failed. ${context.transaction.error ?? 'Please review the transaction details.'}`,
    };
  }

  return {
    templateId: 'transaction-pending-v1',
    subject: `Transaction update: ${context.transaction.id}`,
    message: `${baseMessage(context)} Status: pending. Your payout is still being processed.`,
  };
}
