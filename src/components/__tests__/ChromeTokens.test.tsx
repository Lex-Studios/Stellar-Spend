import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CHROME_TOKENS } from '@/lib/theme-tokens';
import OfflineBanner from '@/components/OfflineBanner';

// Converts a computed color string (e.g. "rgb(201, 169, 98)") to lowercase hex
// so assertions compare against the token values themselves.
function toHex(color: string): string {
  const match = color.match(/\d+/g);
  if (!match) return color;
  return (
    '#' +
    match
      .slice(0, 3)
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('')
  );
}

describe('CHROME_TOKENS', () => {
  it('only contains 6-digit hex colors', () => {
    for (const value of Object.values(CHROME_TOKENS)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('OfflineBanner uses token colors', () => {
  it('paints the banner with the chrome palette', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    render(<OfflineBanner />);

    const banner = screen.getByRole('status');
    const style = getComputedStyle(banner);

    expect(toHex(style.color).toLowerCase()).toBe(CHROME_TOKENS.gold);
    expect(toHex(style.backgroundColor).toLowerCase()).toBe(CHROME_TOKENS.surfaceElevated);

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });
});
