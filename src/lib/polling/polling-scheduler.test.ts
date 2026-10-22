/**
 * Polling scheduler tests (#1304)
 * - Jittered exponential backoff is bounded and grows per attempt.
 * - Services route polling through src/lib/polling instead of raw setInterval loops.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { calculateBackoff, BRIDGE_CONFIG, PAYOUT_CONFIG } from './backoff';

const LIB_DIR = resolve(__dirname, '..');

describe('calculateBackoff', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('grows exponentially per attempt when jitter is zero', () => {
    const cfg = { baseDelay: 1000, maxDelay: 60_000, jitterFactor: 0 };
    expect(calculateBackoff(1, cfg)).toBe(1000);
    expect(calculateBackoff(2, cfg)).toBe(2000);
    expect(calculateBackoff(3, cfg)).toBe(4000);
  });

  it('caps the delay at maxDelay', () => {
    const cfg = { baseDelay: 1000, maxDelay: 5000, jitterFactor: 0 };
    expect(calculateBackoff(10, cfg)).toBe(5000);
  });

  it('adds jitter within [0, jitterFactor * interval)', () => {
    const cfg = { baseDelay: 1000, maxDelay: 60_000, jitterFactor: 0.2 };

    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(calculateBackoff(2, cfg)).toBe(2000);

    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    const jittered = calculateBackoff(2, cfg);
    expect(jittered).toBeGreaterThan(2000);
    expect(jittered).toBeLessThan(2000 + 0.2 * 2000);
  });

  it('is jittered (not identical) across calls with real randomness', () => {
    const cfg = { ...PAYOUT_CONFIG };
    const samples = new Set(Array.from({ length: 20 }, () => calculateBackoff(3, cfg)));
    expect(samples.size).toBeGreaterThan(1);
  });

  it('keeps bridge and payout configs within maxDelay plus jitter', () => {
    for (const cfg of [BRIDGE_CONFIG, PAYOUT_CONFIG]) {
      for (let attempt = 1; attempt <= 20; attempt++) {
        const delay = calculateBackoff(attempt, cfg);
        expect(delay).toBeLessThanOrEqual(cfg.maxDelay * (1 + cfg.jitterFactor));
      }
    }
  });
});

describe('polling is routed through src/lib/polling', () => {
  const POLLING_SERVICES = ['price-alerts.ts', 'background-sync.ts'];

  it.each(POLLING_SERVICES)('%s has no raw setInterval polling loop', (file) => {
    const source = readFileSync(resolve(LIB_DIR, file), 'utf8');
    expect(source).not.toMatch(/setInterval\s*\(/);
  });

  it.each(POLLING_SERVICES)('%s imports the shared polling module', (file) => {
    const source = readFileSync(resolve(LIB_DIR, file), 'utf8');
    expect(source).toMatch(/from\s+['"](\.\/polling|@\/lib\/polling|\.\.\/lib\/polling)[^'"]*['"]/);
  });
});
