import { validateAmount } from '@/lib/offramp';
import { fetchPaycrestQuote, buildQuote, calculateBridgeAmount } from '@/lib/offramp';
import { isSupportedCurrency } from '@/lib/currencies';
import type { ServiceQuoteRequest, ServiceQuoteResponse } from '@stellar-spend/shared';

// Re-export so existing callers that import from this module continue to work.
// New code should import directly from '@stellar-spend/shared'.
export type { ServiceQuoteRequest as QuoteRequest, ServiceQuoteResponse as QuoteResponse };

const STABLECOIN_FEE = '0.5';

const FEE_METHOD_MAP: Record<string, 'stablecoin' | 'native'> = {
  USDC: 'stablecoin',
  stablecoin: 'stablecoin',
  XLM: 'native',
  native: 'native',
};

export class QuoteService {
  async getQuote(request: ServiceQuoteRequest): Promise<ServiceQuoteResponse> {
    this.validateRequest(request);

    const normalizedFee = FEE_METHOD_MAP[request.feeMethod];
    if (!normalizedFee) {
      throw new Error('feeMethod must be "USDC", "XLM", "stablecoin", or "native"');
    }

    const bridgeAmount =
      normalizedFee === 'stablecoin'
        ? calculateBridgeAmount(String(request.amount), 'stablecoin', STABLECOIN_FEE)
        : String(request.amount);

    const paycrestQuote = await fetchPaycrestQuote(bridgeAmount, request.currency);
    return buildQuote(paycrestQuote, request.currency, normalizedFee);
  }

  private validateRequest(request: ServiceQuoteRequest): void {
    if (!validateAmount(String(request.amount ?? ''))) {
      throw new Error('Invalid amount: must be a positive number');
    }

    if (!request.currency || typeof request.currency !== 'string') {
      throw new Error('currency is required');
    }

    if (!isSupportedCurrency(request.currency)) {
      throw new Error(`Unsupported currency: ${request.currency}`);
    }
  }
}
