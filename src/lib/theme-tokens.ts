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
