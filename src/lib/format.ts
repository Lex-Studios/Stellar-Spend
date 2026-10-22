/**
 * Shared currency/number/date formatting helpers.
 *
 * Consolidates logic that was previously duplicated across
 * src/app/history/format.ts, src/components/right-panel/types.ts,
 * src/components/form-card/types.ts, and several inline `toLocaleString()`
 * call sites.
 */

import { formatUtc, formatDate, parseUtc } from './datetime';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
  KES: 'KSh',
  GHS: '₵',
  ZAR: 'R',
};

/** Return the display symbol for an ISO currency code, falling back to the code itself. */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
}

const NGN_FORMATTER = new Intl.NumberFormat('en-NG', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format a fiat amount with its currency symbol/code.
 * NGN uses a symbol + grouped integer (no ISO currency support in Intl for NGN
 * display conventions used elsewhere in the app); other currencies use
 * `Intl.NumberFormat` currency style.
 */
export function formatFiatAmount(value: string | number, currency: string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  const code = currency.toUpperCase();
  const symbol = getCurrencySymbol(currency);

  if (code === 'NGN') {
    return `${symbol}${NGN_FORMATTER.format(num)}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${symbol} ${num.toFixed(2)}`;
  }
}

/** Format a USDC (or other stablecoin) amount with grouped digits. */
export function formatUsdcAmount(
  value: string | number,
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {},
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  const { minimumFractionDigits = 2, maximumFractionDigits = 6 } = options;
  return num.toLocaleString('en-US', { minimumFractionDigits, maximumFractionDigits });
}

/** Format a plain number with grouped digits (e.g. FX rates, alert prices). */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', options).format(value);
}

/** Format a timestamp (ms or Date) as a full date + time string, e.g. "Jun 28, 2026, 10:00 PM". */
export function formatDateTime(value: number | Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString('en-US');
}

/** Format a timestamp (ms) as a short date + time, e.g. "Jun 28, 2026, 10:00 PM". */
export function formatShortDateTime(value: number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Truncate a hash/address for compact display, e.g. "abcdef...123456". */
export function truncateHash(hash: string, headLength = 6, tailLength = 6): string {
  if (!hash || hash.length <= headLength + tailLength) return hash || '—';
  return `${hash.slice(0, headLength)}...${hash.slice(-tailLength)}`;
}

// ── Date formatting (DateFormatter + transaction helpers) ─────────────────────

export interface FormatterConfig {
  locale?: string;
  timeZone?: string;
}

export class DateFormatter {
  private locale: string;
  private timeZone: string;

  constructor(config: FormatterConfig = {}) {
    this.locale = config.locale || 'en-US';
    this.timeZone = config.timeZone || 'UTC';
  }

  formatTimestamp(iso: string): string {
    return formatUtc(iso, this.locale, this.timeZone);
  }

  formatDateOnly(iso: string): string {
    return formatDate(iso, this.locale, this.timeZone);
  }

  formatRelative(iso: string): string {
    const date = parseUtc(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return this.formatDateOnly(iso);
  }

  formatCompact(iso: string): string {
    const date = parseUtc(iso);
    return new Intl.DateTimeFormat(this.locale, {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      timeZone: this.timeZone,
    }).format(date);
  }

  formatRange(fromIso: string, toIso: string): string {
    const from = this.formatDateOnly(fromIso);
    const to = this.formatDateOnly(toIso);
    return `${from} - ${to}`;
  }
}

export const defaultFormatter = new DateFormatter();

export function formatTransaction(iso: string, timeZone?: string): string {
  const formatter = new DateFormatter({ timeZone });
  return formatter.formatTimestamp(iso);
}

export function formatTransactionDate(iso: string, timeZone?: string): string {
  const formatter = new DateFormatter({ timeZone });
  return formatter.formatDateOnly(iso);
}
