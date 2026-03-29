import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { withAllbridgeTimeout } from '@/lib/offramp/utils/timeout';
import { ErrorHandler } from '@/lib/error-handler';

export interface GasFeeOptions {
  feeOptions: {
    native: { int: string; float: string };
    stablecoin: { int: string; float: string };
  };
}

// In-memory cache for gas fee options
let cachedFeeOptions: GasFeeOptions | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 1000; // 60 seconds

/**
 * GET /api/offramp/bridge/gas-fee-options
 * 
 * Fetches gas fee options from Allbridge SDK.
 * Returns native (XLM) and stablecoin (USDC) fee options.
 * Caches result for 60 seconds.
 */
export async function GET(): Promise<NextResponse<GasFeeOptions | { error: string }>> {
  try {
    // Check cache
    const now = Date.now();
    if (cachedFeeOptions && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(cachedFeeOptions, {
        headers: { 'Cache-Control': 'public, max-age=60' },
      });
    }

    // Initialize Allbridge SDK
    const { AllbridgeCoreSdk, nodeRpcUrlsDefault } = await import('@allbridge/bridge-core-sdk');

    const sdk = new AllbridgeCoreSdk({
      ...nodeRpcUrlsDefault,
      sorobanNetworkPassphrase: 'Public Global Stellar Network ; September 2015',
      ...(env.public.NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL && {
        sorobanRpc: env.public.NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL,
      }),
      ...(env.server.BASE_RPC_URL && {
        ETH: env.server.BASE_RPC_URL,
      }),
    });

    // Get chain details to find USDC tokens
    const chainDetails = await withAllbridgeTimeout(
      sdk.chainDetailsMap(),
      'chainDetailsMap'
    );

    let stellarChain: any = null;
    let baseChain: any = null;

    for (const [, chain] of Object.entries(chainDetails)) {
      const chainObj = chain as any;
      if (chainObj.name?.toLowerCase().includes('stellar') || chainObj.name?.toLowerCase().includes('soroban')) {
        stellarChain = chainObj;
      }
      if (chainObj.name?.toLowerCase().includes('ethereum') || chainObj.name?.toLowerCase().includes('base')) {
        baseChain = chainObj;
      }
    }

    if (!stellarChain || !baseChain) {
      throw new Error('Failed to fetch chain details from Allbridge');
    }

    // Find USDC tokens on both chains
    const stellarUsdc = stellarChain.tokens.find((t: any) => t.symbol === 'USDC');
    const baseUsdc = baseChain.tokens.find((t: any) => t.symbol === 'USDC');

    if (!stellarUsdc || !baseUsdc) {
      throw new Error('USDC token not found on one or both chains');
    }

    // Get gas fee options from Allbridge SDK
    const gasFeeOptions = await withAllbridgeTimeout(
      sdk.getAllbridgeGasFeeOptions(stellarUsdc, baseUsdc),
      'getAllbridgeGasFeeOptions'
    );

    const result: GasFeeOptions = {
      feeOptions: {
        native: {
          int: gasFeeOptions.native.int.toString(),
          float: gasFeeOptions.native.float.toString(),
        },
        stablecoin: {
          int: gasFeeOptions.stablecoin.int.toString(),
          float: gasFeeOptions.stablecoin.float.toString(),
        },
      },
    };

    // Cache the result
    cachedFeeOptions = result;
    cacheTimestamp = now;

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    console.error('Error fetching gas fee options:', error);
    return ErrorHandler.handle(error);
  }
}
