/**
 * Single source of truth for theme color tokens.
 *
 * These values must stay in sync with src/app/globals.css.
 * Consumed by useTheme, contrast-checker, and all theme regression tests.
 */

export type ThemeTokens = Record<string, string>;

export const DARK_TOKENS: ThemeTokens = {
  bg: '#0a0a0a',
  panel: '#131313',
  'panel-elevated': '#1a1a1a',
  'panel-overlay': '#1f1f1f',
  line: '#2a2a2a',
  'line-strong': '#3a3a3a',
  muted: '#8a8a8a',
  text: '#ffffff',
  'text-subtle': '#d0d0d0',
  accent: '#d4b06a',
  'accent-hover': '#e0c07f',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
};

export const LIGHT_TOKENS: ThemeTokens = {
  bg: '#f5f5f5',
  panel: '#ffffff',
  'panel-elevated': '#fafafa',
  'panel-overlay': '#ffffff',
  line: '#e0e0e0',
  'line-strong': '#cccccc',
  muted: '#5f5f5f',
  text: '#0a0a0a',
  'text-subtle': '#333333',
  // Fixed in #1041 — see globals.css
  accent: '#8a6b15',
  'accent-hover': '#7d6013',
  success: '#0e7a38',
  warning: '#b45309',
  error: '#c81e1e',
  info: '#1d4ed8',
};

/**
 * Chrome palette used by the app shell (offline banner, install prompt,
 * update prompt). Lives here so those components never hard-code hex values.
 */
export const CHROME_TOKENS = {
  surface: '#111111',
  surfaceElevated: '#1a1a1a',
  border: '#333333',
  borderMuted: '#555555',
  gold: '#c9a962',
  goldHover: '#d4b982',
  textDim: '#999999',
  textFaint: '#666666',
} as const;

export const HIGH_CONTRAST_TOKENS: ThemeTokens = {
  bg: '#000000',
  panel: '#000000',
  'panel-elevated': '#0a0a0a',
  'panel-overlay': '#0a0a0a',
  line: '#ffffff',
  'line-strong': '#ffffff',
  muted: '#ffff00',
  text: '#ffffff',
  'text-subtle': '#ffffff',
  accent: '#ffff00',
  'accent-hover': '#ffffff',
  success: '#00ff00',
  warning: '#ffff00',
  error: '#ff6060',
  info: '#00ffff',
};

// ---------------------------------------------------------------------------
// Status variants
// ---------------------------------------------------------------------------

/** Semantic color roles shared by transaction badges and status-page indicators. */
export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral' | 'special';

/** Container classes for each variant (border, background and text). */
export const STATUS_VARIANT_CLASSES: Record<StatusVariant, string> = {
  success: 'bg-green-500/10 border border-green-500/40 text-green-400',
  warning: 'bg-yellow-500/10 border border-yellow-500/40 text-yellow-400',
  danger: 'bg-red-500/10 border border-red-500/40 text-red-400',
  info: 'bg-blue-500/10 border border-blue-500/40 text-blue-400',
  accent: 'bg-[#c9a962]/15 border border-[#c9a962]/60 text-[#c9a962]',
  neutral: 'bg-[#333333]/40 border border-[#333333] text-[#777777]',
  special: 'bg-purple-500/10 border border-purple-500/40 text-purple-400',
};

/** Indicator dot classes for each variant. */
export const STATUS_VARIANT_DOT_CLASSES: Record<StatusVariant, string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-400',
  danger: 'bg-red-500',
  info: 'bg-blue-400',
  accent: 'bg-[#c9a962]',
  neutral: 'bg-[#555555]',
  special: 'bg-purple-500',
};

/** The single status-to-variant map. Covers transaction and component/corridor statuses. */
export const STATUS_VARIANTS: Record<string, StatusVariant> = {
  // Offramp row and step statuses
  SETTLING: 'accent',
  COMPLETE: 'success',
  idle: 'neutral',
  initiating: 'info',
  'awaiting-signature': 'warning',
  submitting: 'info',
  processing: 'accent',
  settling: 'accent',
  success: 'success',
  error: 'danger',
  // Stored transaction statuses
  pending: 'warning',
  completed: 'success',
  failed: 'danger',
  reversed: 'special',
  partially_reversed: 'special',
  // Status page component and corridor health
  operational: 'success',
  degraded: 'warning',
  down: 'danger',
};
