import type { Repository } from './base';

export interface Transaction {
  id: string;
  timestamp: number;
  finalizedAt?: number;
  userAddress: string;
  amount: string;
  currency: string;
  feeMethod?: string;
  bridgeFee?: string;
  networkFee?: string;
  paycrestFee?: string;
  totalFee?: string;
  stellarTxHash?: string;
  bridgeStatus?: string;
  payoutOrderId?: string;
  payoutStatus?: string;
  beneficiary: {
    institution: string;
    accountIdentifier: string;
    accountName: string;
    currency: string;
  };
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface TransactionRepository extends Repository<Transaction> {
  getByUser(userAddress: string): Promise<Transaction[]>;
  getByPayoutOrderId(orderId: string): Promise<Transaction | null>;
}
