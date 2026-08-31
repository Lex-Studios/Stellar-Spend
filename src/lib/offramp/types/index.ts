export type { TradeState, BridgeStatus, PayoutStatus } from '@/lib/transaction-status';

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  contract: string;
  chain: string;
}

export interface QuoteRequest {
  sourceToken: TokenInfo;
  destinationToken: TokenInfo;
  amount: string;
  isFiatInput: boolean;
  currency: string;
}

export interface QuoteResponse {
  sourceAmount: string;
  destinationAmount: string;
  bridgeFee: string;
  payoutFee: string;
  rate: number;
  estimatedTime: number;
  validUntil: Date;
}

export interface BeneficiaryInfo {
  institution: string;
  accountIdentifier: string;
  accountName: string;
  currency: string;
  memo?: string;
  metadata?: Record<string, unknown>;
}

export interface ExecuteRequest {
  quoteId: string;
  sourceAddress: string;
  beneficiary: BeneficiaryInfo;
}

export interface ExecuteResponse {
  tradeId: string;
  state: TradeState;
  sourceTxHash?: string;
  bridgeTransferId?: string;
  payoutOrderId?: string;
  destinationTxHash?: string;
}

export interface TradeStatus {
  tradeId: string;
  state: TradeState;
  sourceTxHash?: string;
  bridgeStatus?: BridgeStatus;
  bridgeTransferId?: string;
  payoutOrderId?: string;
  payoutStatus?: PayoutStatus;
  destinationTxHash?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BridgeTransferRequest {
  amount: string;
  sourceToken: TokenInfo;
  destinationToken: TokenInfo;
  fromAddress: string;
  toAddress: string;
}

export interface BridgeTransferResponse {
  transferId: string;
  status: BridgeStatus;
  estimatedTime: number;
}

export interface PayoutOrderRequest {
  amount: number;
  token: string;
  network: string;
  rate: number;
  recipient: BeneficiaryInfo;
  reference: string;
  returnAddress: string;
}

export interface PayoutOrderResponse {
  id: string;
  receiveAddress: string;
  amount: string;
  senderFee: string;
  transactionFee: string;
  validUntil: string;
  status: PayoutStatus;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
