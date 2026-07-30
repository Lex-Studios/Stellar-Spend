export interface DepositProviderAdapter {
  getQuote(
    request: OnrampProviderQuoteRequest,
  ): Promise<OnrampProviderQuoteResponse>;
  createOrder(
    request: OnrampProviderOrderRequest,
  ): Promise<OnrampProviderOrderResponse>;
  getOrderStatus(orderId: string): Promise<{ status: string; txHash?: string }>;
  getHealth(): Promise<{ ok: boolean; latencyMs: number }>;
  getCapabilities(): OnrampProviderCapabilities;
}

export interface OnrampProviderQuoteRequest {
  fiatAmount: string;
  fiatCurrency: string;
  destinationToken: string;
  destinationNetwork: string;
}

export interface OnrampProviderQuoteResponse {
  destinationAmount: string;
  rate: number;
  fee: string;
  estimatedTime: number;
  validUntil: string;
}

export interface OnrampProviderOrderRequest {
  fiatAmount: string;
  fiatCurrency: string;
  destinationAmount: string;
  destinationToken: string;
  destinationNetwork: string;
  destinationAddress: string;
  reference: string;
}

export interface OnrampProviderOrderResponse {
  orderId: string;
  depositAddress: string;
  depositNetwork: string;
  depositAmount: string;
  depositToken: string;
  status: string;
  validUntil: string;
}

export interface OnrampProviderCapabilities {
  supportedFiatCurrencies: string[];
  supportedDestinationTokens: string[];
  supportedNetworks: string[];
  maxAmount: number;
  minAmount: number;
  instantSettlement: boolean;
}
