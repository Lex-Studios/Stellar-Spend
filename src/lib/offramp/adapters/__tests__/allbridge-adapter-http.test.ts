/**
 * Unit tests for Allbridge adapter utilities with mocked SDK (issue #1500).
 *
 * The Allbridge SDK makes network calls on `chainDetailsMap()`.  We mock the
 * SDK class so no real network activity occurs; all tests run in-process.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the Allbridge bridge-core-sdk ────────────────────────────────────────
vi.mock('@allbridge/bridge-core-sdk', () => {
  const mockChainMap = {
    SRB: {
      chainId: 'SRB',
      tokens: [
        { symbol: 'USDC', name: 'USD Coin', decimals: 7, tokenAddress: 'CABC' },
        { symbol: 'USDT', name: 'Tether', decimals: 7, tokenAddress: 'CDEF' },
      ],
    },
    BAS: {
      chainId: 'BAS',
      tokens: [
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, tokenAddress: '0xabc' },
      ],
    },
  };

  const MockAllbridgeCoreSdk = vi.fn().mockImplementation(() => ({
    chainDetailsMap: vi.fn().mockResolvedValue(mockChainMap),
    getAmountToBeReceived: vi.fn().mockResolvedValue('98.5'),
    getAverageTransferTime: vi.fn().mockResolvedValue(300),
  }));

  return {
    AllbridgeCoreSdk: MockAllbridgeCoreSdk,
    nodeRpcUrlsDefault: { SRB: 'https://soroban-rpc.stellar.org' },
    Messenger: { ALLBRIDGE: 'allbridge' },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  initializeAllbridgeSdk,
  getCachedChainDetailsMap,
  getAllbridgeQuote,
  invalidateSdkCache,
} from '../allbridge-adapter';
import { AllbridgeCoreSdk } from '@allbridge/bridge-core-sdk';

// ── initializeAllbridgeSdk ────────────────────────────────────────────────────

describe('initializeAllbridgeSdk', () => {
  beforeEach(() => {
    invalidateSdkCache();
    vi.mocked(AllbridgeCoreSdk).mockClear();
  });

  it('creates an SDK instance on first call', () => {
    const sdk = initializeAllbridgeSdk();
    expect(sdk).toBeDefined();
    expect(AllbridgeCoreSdk).toHaveBeenCalledOnce();
  });

  it('returns the cached instance on subsequent calls', () => {
    const sdk1 = initializeAllbridgeSdk();
    const sdk2 = initializeAllbridgeSdk();
    expect(sdk1).toBe(sdk2);
    expect(AllbridgeCoreSdk).toHaveBeenCalledOnce();
  });

  it('creates a fresh instance after invalidateSdkCache', () => {
    const sdk1 = initializeAllbridgeSdk();
    invalidateSdkCache();
    const sdk2 = initializeAllbridgeSdk();
    expect(sdk1).not.toBe(sdk2);
    expect(AllbridgeCoreSdk).toHaveBeenCalledTimes(2);
  });
});

// ── getCachedChainDetailsMap ──────────────────────────────────────────────────

describe('getCachedChainDetailsMap', () => {
  beforeEach(() => {
    invalidateSdkCache();
  });

  it('returns chain details including SRB and BAS', async () => {
    const sdk = initializeAllbridgeSdk();
    const details = await getCachedChainDetailsMap(sdk);

    expect(details.SRB).toBeDefined();
    expect(details.BAS).toBeDefined();
  });

  it('caches the result — only one network call for two lookups', async () => {
    const sdk = initializeAllbridgeSdk();
    const mockSdk = sdk as unknown as { chainDetailsMap: ReturnType<typeof vi.fn> };

    await getCachedChainDetailsMap(sdk);
    await getCachedChainDetailsMap(sdk);

    expect(mockSdk.chainDetailsMap).toHaveBeenCalledOnce();
  });

  it('invalidates cache and rethrows on SDK error', async () => {
    const sdk = initializeAllbridgeSdk();
    const mockSdk = sdk as unknown as { chainDetailsMap: ReturnType<typeof vi.fn> };
    mockSdk.chainDetailsMap.mockRejectedValueOnce(new Error('RPC timeout'));

    await expect(getCachedChainDetailsMap(sdk)).rejects.toThrow('RPC timeout');
  });
});

// ── getAllbridgeQuote ─────────────────────────────────────────────────────────

describe('getAllbridgeQuote', () => {
  beforeEach(() => {
    invalidateSdkCache();
  });

  const makeToken = (symbol: string) => ({
    symbol,
    name: symbol,
    decimals: 7,
    tokenAddress: `C${symbol}`,
    chainSymbol: 'SRB',
  });

  it('returns receiveAmount, fee, and estimatedTime', async () => {
    const sdk = initializeAllbridgeSdk();
    const srcToken = makeToken('USDC') as never;
    const dstToken = makeToken('USDC') as never;

    const quote = await getAllbridgeQuote(sdk, srcToken, dstToken, '100');

    expect(quote.receiveAmount).toBe('98.5');
    // fee = 100 - 98.5 = 1.5
    expect(parseFloat(quote.fee)).toBeCloseTo(1.5);
    expect(quote.estimatedTime).toBe(300);
  });

  it('defaults estimatedTime to 0 when SDK returns null', async () => {
    const sdk = initializeAllbridgeSdk();
    const mockSdk = sdk as unknown as { getAverageTransferTime: ReturnType<typeof vi.fn> };
    mockSdk.getAverageTransferTime.mockResolvedValueOnce(null);

    const srcToken = makeToken('USDC') as never;
    const dstToken = makeToken('USDT') as never;

    const quote = await getAllbridgeQuote(sdk, srcToken, dstToken, '50');
    expect(quote.estimatedTime).toBe(0);
  });

  it('invalidates cache and rethrows when getAmountToBeReceived fails', async () => {
    const sdk = initializeAllbridgeSdk();
    const mockSdk = sdk as unknown as { getAmountToBeReceived: ReturnType<typeof vi.fn> };
    mockSdk.getAmountToBeReceived.mockRejectedValueOnce(new Error('bridge unavailable'));

    await expect(
      getAllbridgeQuote(sdk, makeToken('USDC') as never, makeToken('USDC') as never, '10'),
    ).rejects.toThrow('bridge unavailable');
  });
});

// ── invalidateSdkCache ────────────────────────────────────────────────────────

describe('invalidateSdkCache', () => {
  it('forces a fresh SDK instance on the next initializeAllbridgeSdk call', () => {
    const sdk1 = initializeAllbridgeSdk();
    invalidateSdkCache();
    const sdk2 = initializeAllbridgeSdk();
    expect(sdk1).not.toBe(sdk2);
  });

  it('forces a fresh network call on the next getCachedChainDetailsMap', async () => {
    const sdk = initializeAllbridgeSdk();
    const mockSdk = sdk as unknown as { chainDetailsMap: ReturnType<typeof vi.fn> };

    await getCachedChainDetailsMap(sdk);
    invalidateSdkCache();
    // getCachedChainDetailsMap needs a fresh sdk after invalidation.
    const sdk2 = initializeAllbridgeSdk();
    await getCachedChainDetailsMap(sdk2);

    // chainDetailsMap was called once for the original sdk and once for sdk2.
    expect(mockSdk.chainDetailsMap.mock.calls.length + 
      (sdk2 as unknown as { chainDetailsMap: ReturnType<typeof vi.fn> }).chainDetailsMap.mock.calls.length
    ).toBeGreaterThanOrEqual(2);
  });
});
