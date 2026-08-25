export interface RightPanelProps {
  isConnected: boolean;
  isConnecting: boolean;
  amount: string;
  quote: { destinationAmount: string; rate: number; currency: string } | null;
  isLoadingQuote: boolean;
  currency: string;
  onConnect: () => void;
}

const NGN_FORMATTER = new Intl.NumberFormat('en-NG', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
    KES: 'KSh',
    GHS: '₵',
    ZAR: 'R',
  };
  return symbols[currency.toUpperCase()] || currency.toUpperCase();
}

export function formatFiat(value: string | number, currency: string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  const symbol = getCurrencySymbol(currency);

  if (currency.toUpperCase() === 'NGN') {
    return `${symbol}${NGN_FORMATTER.format(num)}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${symbol} ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)}`;
  }
}

export function formatRate(rate: number, currency: string): string {
  if (!rate) return '—';
  return `${formatFiat(rate, currency)} / USDC`;
}

export function formatNetworkFee(quote: RightPanelProps['quote']): string {
  if (!quote) return '—';
  return '2.50 USDC';
}
