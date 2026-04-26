/**
 * Payout Service Implementation
 */

import {
  IPayoutService,
  CreateOrderParams,
  PayoutOrder,
  PayoutStatus,
  ExecutePayoutResult,
} from './interfaces';

export class PayoutService implements IPayoutService {
  async createOrder(params: CreateOrderParams): Promise<PayoutOrder> {
    // This would integrate with the existing paycrest/order logic
    throw new Error('Not implemented - integrate with existing paycrest order route');
  }

  async getStatus(orderId: string): Promise<PayoutStatus> {
    // This would integrate with the existing status logic
    throw new Error('Not implemented - integrate with existing status route');
  }

  async executePayout(orderId: string, amount: string): Promise<ExecutePayoutResult> {
    // This would integrate with the existing execute-payout logic
    throw new Error('Not implemented - integrate with existing execute-payout route');
  }
}
