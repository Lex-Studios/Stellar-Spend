/**
 * Quote Service Implementation
 */

import { IQuoteService, QuoteResult } from './interfaces';
import { validateAmount } from '@/lib/offramp/utils/validation';
import { fetchPaycrestQuote, buildQuote, calculateBridgeAmount } from '@/lib/offramp/utils/quote-fetcher';
import { isSupportedCurrency } from '@/lib/currencies';
import { CONFIG } from '@/lib/config';

const FEE_METHOD_MAP: Record<string, 'stablecoin' | 'native'> = {
  USDC: 'stablecoin',
  stablecoin: 'stablecoin',
  XLM: 'native',
  native: 'native',
};

export class QuoteService implements IQuoteService {
  async getQuote(amount: string, currency: string, feeMethod: string): Promise<QuoteResult> {
    if (!this.validateAmount(amount)) {
      throw new Error('Invalid amount: must be a positive number');
    }

    if (!currency || typeof currency !== 'string') {
      throw new Error('currency is required');
    }

    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    const normalizedFee = FEE_METHOD_MAP[feeMethod];
    if (!normalizedFee) {
      throw new Error('feeMethod must be "USDC", "XLM", "stablecoin", or "native"');
    }

    const bridgeAmount = normalizedFee === 'stablecoin'
      ? calculateBridgeAmount(amount, 'stablecoin', CONFIG.FEES.STABLECOIN_FEE)
      : amount;

    // Get bridge quote
    const receiveAmount = await this.getBridgeQuote(bridgeAmount);

    // Get Paycrest FX rate
    const { rate, destinationAmount } = await fetchPaycrestQuote(receiveAmount, currency);

    return buildQuote(
      destinationAmount,
      rate,
      currency,
      CONFIG.FEES.BRIDGE_FEE_PERCENTAGE.toString(),
      CONFIG.FEES.PAYOUT_FEE_PERCENTAGE.toString(),
      CONFIG.TRANSACTION.ESTIMATED_TIME_SECONDS
    );
  }

  validateAmount(amount: string): boolean {
    return validateAmount(amount);
  }

  private async getBridgeQuote(bridgeAmount: string): Promise<string> {
    try {
      const { AllbridgeCoreSdk, nodeRpcUrlsDefault } = await import('@allbridge/bridge-core-sdk');
      const { env } = await import('@/lib/env');

      const sdk = new AllbridgeCoreSdk({
        ...nodeRpcUrlsDefault,
        sorobanNetworkPassphrase: CONFIG.STELLAR.MAINNET_PASSPHRASE,
        ...(env.public.NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL && {
          sorobanRpc: env.public.NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL,
        }),
        ...(env.server.BASE_RPC_URL && { ETH: env.server.BASE_RPC_URL }),
      });

      const chainDetails = await sdk.chainDetailsMap();
      let stellarChain: any = null;
      let baseChain: any = null;

      for (const [, chain] of Object.entries(chainDetails)) {
        const c = chain as any;
        if (c.name?.toLowerCase().includes('stellar') || c.name?.toLowerCase().includes('soroban')) stellarChain = c;
        if (c.name?.toLowerCase().includes('ethereum') || c.name?.toLowerCase().includes('base')) baseChain = c;
      }

      if (!stellarChain || !baseChain) throw new Error('Chain details unavailable');

      const stellarUsdc = stellarChain.tokens.find((t: any) => t.symbol === 'USDC');
      const baseUsdc = baseChain.tokens.find((t: any) => t.symbol === 'USDC');

      if (!stellarUsdc || !baseUsdc) throw new Error('USDC token not found');

      return await sdk.getAmountToBeReceived(bridgeAmount, stellarUsdc, baseUsdc);
    } catch (error) {
      throw new Error('Bridge quote unavailable');
    }
  }
}
