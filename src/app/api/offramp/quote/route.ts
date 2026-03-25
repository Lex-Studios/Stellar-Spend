import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { validateAmount } from '@/lib/offramp/utils/validation';
import { fetchPaycrestQuote, buildQuote, calculateBridgeAmount } from '@/lib/offramp/utils/quote-fetcher';

// Stablecoin fee in USDC (example: 0.5 USDC)
const STABLECOIN_FEE = '0.5';

/**
 * POST /api/offramp/quote
 * 
 * Fetches a quote for offramp transaction:
 * 1. Validates input amount
 * 2. Initializes Allbridge SDK (cached singleton)
 * 3. Calls getAllbridgeQuote to get receiveAmount
 * 4. If fee method is "stablecoin": subtracts fee from amount before quoting
 * 5. Fetches Paycrest rate for destination currency
 * 6. Calculates destination amount with 1% platform fee
 * 7. Validates and returns quote
 * 
 * Request body:
 * {
 *   amount: string (USDC amount)
 *   currency: string (destination currency code, e.g., 'NGN')
 *   feeMethod: 'native' | 'stablecoin'
 * }
 * 
 * Response:
 * {
 *   destinationAmount: string
 *   rate: number
 *   currency: string
 *   bridgeFee: string
 *   payoutFee: string
 *   estimatedTime: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, feeMethod } = body;

    // Validate input
    if (!validateAmount(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount: must be a positive number' },
        { status: 400 }
      );
    }

    if (!currency || typeof currency !== 'string') {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      );
    }

    if (!['native', 'stablecoin'].includes(feeMethod)) {
      return NextResponse.json(
        { error: 'Invalid feeMethod: must be "native" or "stablecoin"' },
        { status: 400 }
      );
    }

    // Calculate bridge amount based on fee method
    let bridgeAmount = amount;
    if (feeMethod === 'stablecoin') {
      bridgeAmount = calculateBridgeAmount(amount, 'stablecoin', STABLECOIN_FEE);
    }

    // Initialize Allbridge SDK (cached singleton promise)
    const { AllbridgeCoreSdk, nodeRpcUrlsDefault, ChainSymbol } = await import('@allbridge/bridge-core-sdk');
    
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
    const chainDetails = await sdk.chainDetailsMap();
    
    // Find Stellar and Base chains
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

    // Get quote from Allbridge for bridge transfer
    // This returns the amount received on the destination chain (Base)
    const receiveAmount = await sdk.getAmountToBeReceived(
      stellarUsdc,
      baseUsdc,
      bridgeAmount
    );

    // Fetch Paycrest rate and calculate destination amount
    const { rate, destinationAmount } = await fetchPaycrestQuote(receiveAmount, currency);

    // Build and validate quote
    const quote = buildQuote(
      destinationAmount,
      rate,
      currency,
      '0', // bridgeFee - would come from SDK if available
      '0', // payoutFee - would come from SDK if available
      300  // estimatedTime in seconds
    );

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Quote fetch error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    // Return appropriate error response
    if (message.includes('Invalid')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.includes('Paycrest')) {
      return NextResponse.json(
        { error: 'Failed to fetch exchange rate' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate quote' },
      { status: 500 }
    );
  }
}
