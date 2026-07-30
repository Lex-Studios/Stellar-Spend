export type OnrampState =
  | "draft"
  | "quoted"
  | "order_created"
  | "deposit_pending"
  | "deposit_confirmed"
  | "bridge_pending"
  | "bridge_completed"
  | "completed"
  | "failed"
  | "expired";

export type DepositStatus = "pending" | "confirmed" | "failed" | "expired";

export interface OnrampQuoteRequest {
  fiatAmount: string;
  fiatCurrency: string;
  destinationToken: string;
  destinationAddress: string;
  provider?: string;
}

export interface OnrampQuoteResponse {
  quoteId: string;
  fiatAmount: string;
  fiatCurrency: string;
  destinationAmount: string;
  destinationToken: string;
  rate: number;
  bridgeFee: string;
  providerFee: string;
  totalFee: string;
  estimatedTime: number;
  validUntil: string;
  provider: string;
}

export interface OnrampOrderRequest {
  quoteId: string;
  fiatAmount: string;
  fiatCurrency: string;
  destinationAmount: string;
  destinationToken: string;
  destinationAddress: string;
  provider: string;
  rate: number;
}

export interface OnrampOrderResponse {
  orderId: string;
  status: OnrampState;
  depositAddress: string;
  depositNetwork: string;
  depositAmount: string;
  depositToken: string;
  destinationAmount: string;
  destinationToken: string;
  destinationAddress: string;
  fiatAmount: string;
  fiatCurrency: string;
  provider: string;
  createdAt: string;
  validUntil: string;
}

export interface OnrampOrderStatus {
  orderId: string;
  status: OnrampState;
  depositStatus?: DepositStatus;
  bridgeStatus?: string;
  txHash?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnrampWebhookPayload {
  event: string;
  data: {
    orderId: string;
    txHash?: string;
    status?: string;
    amount?: string;
    currency?: string;
    [key: string]: unknown;
  };
}
