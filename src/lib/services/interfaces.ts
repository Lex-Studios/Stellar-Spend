/**
 * Service layer interfaces for dependency injection
 */

export interface IQuoteService {
  getQuote(amount: string, currency: string, feeMethod: string): Promise<QuoteResult>;
  validateAmount(amount: string): boolean;
}

export interface IBridgeService {
  buildTransaction(params: BuildTxParams): Promise<BuildTxResult>;
  submitTransaction(xdr: string): Promise<SubmitTxResult>;
  getStatus(txHash: string): Promise<BridgeStatus>;
  getGasFeeOptions(amount: string): Promise<GasFeeOption[]>;
}

export interface IPayoutService {
  createOrder(params: CreateOrderParams): Promise<PayoutOrder>;
  getStatus(orderId: string): Promise<PayoutStatus>;
  executePayout(orderId: string, amount: string): Promise<ExecutePayoutResult>;
}

export interface IWalletService {
  connect(walletType: string): Promise<WalletConnection>;
  disconnect(): Promise<void>;
  signTransaction(xdr: string): Promise<string>;
  getBalance(address: string): Promise<string>;
}

// ── Type Definitions ──────────────────────────────────────────────────────

export interface QuoteResult {
  destinationAmount: string;
  rate: number;
  currency: string;
  bridgeFee: string;
  payoutFee: string;
  estimatedTime: number;
}

export interface BuildTxParams {
  amount: string;
  fromAddress: string;
  toAddress: string;
  feePaymentMethod: 'stablecoin' | 'native';
}

export interface BuildTxResult {
  xdr: string;
  sourceToken: TokenInfo;
  destinationToken: TokenInfo;
}

export interface TokenInfo {
  symbol: string;
  decimals: number;
  chain: string;
}

export interface SubmitTxResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface BridgeStatus {
  status: 'pending' | 'completed' | 'failed';
  progress: number;
  estimatedTime: number;
}

export interface GasFeeOption {
  method: 'stablecoin' | 'native';
  amount: string;
  symbol: string;
}

export interface CreateOrderParams {
  amount: string;
  currency: string;
  beneficiary: BeneficiaryInfo;
}

export interface BeneficiaryInfo {
  accountNumber: string;
  bankCode: string;
  name: string;
}

export interface PayoutOrder {
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: string;
  currency: string;
}

export interface PayoutStatus {
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTime: number;
}

export interface ExecutePayoutResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface WalletConnection {
  address: string;
  walletType: string;
  isConnected: boolean;
}
