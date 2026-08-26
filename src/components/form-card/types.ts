import type { BankMode } from '@/components/BankAccountInput';
import type { InsuranceQuote } from '@/components/InsuranceOption';
import type { ProviderQuote } from '@/components/QuoteComparison';
import type { QuoteResult as QuoteFetcherResult } from '@/lib/offramp';

export type FeeMethod = 'USDC' | 'XLM';

export type QuoteResult = QuoteFetcherResult;

export interface Currency {
  code: string;
  name: string;
}

export interface Institution {
  code: string;
  name: string;
}

export interface GasFeeOptions {
  usdcFee: string;
  xlmFee: string;
}

export interface OfframpPayload {
  amount: string;
  currency: string;
  institution: string;
  accountIdentifier: string;
  accountName: string;
  feeMethod: FeeMethod;
  bankMode: BankMode;
  routingNumber?: string;
  iban?: string;
  quote: QuoteResult | null;
  insurance: {
    enabled: boolean;
    quote: InsuranceQuote | null;
  };
}

export interface FormCardProps {
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onSubmit: (payload: OfframpPayload) => void;
  resetKey?: number;
  onQuoteChange?: (quote: QuoteResult | null) => void;
  onAmountChange?: (v: string) => void;
  onCurrencyChange?: (v: string) => void;
  isInitialLoading?: boolean;
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
  KES: 'KSh',
  GHS: '₵',
  ZAR: 'R',
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
}

export function formatPayout(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '—';
  const symbol = getCurrencySymbol(currency);
  if (currency.toUpperCase() === 'NGN') {
    return `${symbol}${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(num)}`;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${symbol} ${num.toFixed(2)}`;
  }
}

export function buildProviderQuotes(quote: QuoteResult, currency: string): ProviderQuote[] {
  const base = parseFloat(quote.destinationAmount);
  const baseRate = quote.rate;
  const baseFee = parseFloat(quote.bridgeFee ?? '0.5');

  return [
    {
      id: 'paycrest',
      provider: 'Paycrest',
      rate: baseRate,
      bridgeFee: baseFee.toFixed(2),
      payoutFee: '0.00',
      totalFee: baseFee.toFixed(2),
      estimatedTime: 300,
      destinationAmount: base.toFixed(2),
      currency,
      rating: 5,
      badge: 'Best Rate',
    },
    {
      id: 'yellowcard',
      provider: 'Yellow Card',
      rate: Math.round(baseRate * 0.992),
      bridgeFee: (baseFee + 0.3).toFixed(2),
      payoutFee: '0.50',
      totalFee: (baseFee + 0.8).toFixed(2),
      estimatedTime: 180,
      destinationAmount: (base * 0.992).toFixed(2),
      currency,
      rating: 4,
      badge: 'Fastest',
    },
    {
      id: 'kotani',
      provider: 'Kotani Pay',
      rate: Math.round(baseRate * 0.985),
      bridgeFee: (baseFee + 0.1).toFixed(2),
      payoutFee: '0.20',
      totalFee: (baseFee + 0.3).toFixed(2),
      estimatedTime: 420,
      destinationAmount: (base * 0.985).toFixed(2),
      currency,
      rating: 4,
      badge: 'Lowest Fee',
    },
  ];
}

export type CtaState = 'disconnected' | 'connecting' | 'ready' | 'submitting';

export function getCtaLabel(state: CtaState): string {
  switch (state) {
    case 'disconnected':
      return 'CONNECT WALLET';
    case 'connecting':
      return 'WAITING FOR SIGNATURE...';
    case 'submitting':
      return 'INITIATING OFFRAMP...';
    default:
      return 'INITIATE OFFRAMP →';
  }
}
