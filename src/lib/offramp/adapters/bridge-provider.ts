import type { TokenInfo, BridgeTransferRequest, BridgeStatus } from '../types';

export interface BridgeProviderAdapter {
  getQuote(request: BridgeTransferRequest): Promise<{
    receiveAmount: string;
    fee: string;
    estimatedTime: number;
  }>;
  buildSendTx(request: BridgeTransferRequest): Promise<unknown>;
  getTransferStatus(transferId: string): Promise<{ status: BridgeStatus; txHash?: string }>;
  getAverageTransferTime(sourceToken: TokenInfo, destinationToken: TokenInfo): number;
}
