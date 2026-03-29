import type { PayoutStatus } from '@/lib/offramp/types';

export function mapPaycrestStatus(eventType: string): PayoutStatus | null {
  switch (eventType) {
    case 'payment_order.pending':      return 'pending';
    case 'payment_order.validated':    return 'validated';
    case 'payment_order.settled':      return 'settled';
    case 'payment_order.refunded':     return 'refunded';
    case 'payment_order.expired':      return 'expired';
    default:                           return null;
  }
}
