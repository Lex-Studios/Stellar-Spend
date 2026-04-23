import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { validateAmount, validateAddress } from '@/lib/offramp/utils/validation';
import { extractErrorMessage } from '@/lib/offramp/utils/errors';
import { buildTxLimiter, getClientIp } from '@/lib/offramp/utils/rate-limiter';
import { generateRequestId, createRequestLogger } from '@/lib/offramp/utils/logger';

export const maxDuration = 30;

/**
 * POST /api/offramp/bridge/build-tx
 * 
 * Builds a Soroban XDR transaction for bridging USDC from Stellar to Base.
 * 
 * Request body:
 * {
 *   amount: string (USDC amount)
 *   fromAddress: string (Stellar address)
 *   toAddress: string (Base address)
 *   feePaymentMethod: 'native' | 'stablecoin' (default: 'stablecoin')
 * }
 * 
 * Response:
 * {
 *   xdr: string
 *   sourceToken: { symbol, decimals, contract, chain }
 *   destinationToken: { symbol, decimals, contract, chain }
 * }
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const clientIp = getClientIp(request);
  const logger = createRequestLogger(requestId, 'POST', '/api/offramp/bridge/build-tx');

  try {
    // Check rate limit
    const rateLimitCheck = buildTxLimiter.check(clientIp);
    if (!rateLimitCheck.allowed) {
      logger.logError(429, 'Rate limit exceeded');
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitCheck.retryAfter),
            'X-Request-Id': requestId,
          },
        }
      );
    }

    const body = await request.json();
    const { amount, fromAddress, toAddress, feePaymentMethod = 'stablecoin' } = body;

    // Validate inputs
    if (!validateAmount(amount)) {
      logger.logError(400, 'Invalid amount: must be a positive number');
      return NextResponse.json(
        { error: 'Invalid amount: must be a positive number' },
        { status: 400, headers: { 'X-Request-Id': requestId } }
      );
    }

    if (!validateAddress(fromAddress, 'stellar')) {
      logger.logError(400, 'Invalid Stellar address');
      return NextResponse.json(
        { error: 'Invalid Stellar address' },
        { status: 400, headers: { 'X-Request-Id': requestId } }
      );
    }

    if (!validateAddress(toAddress, 'base')) {
      logger.logError(400, 'Invalid Base address');
      return NextResponse.json(
        { error: 'Invalid Base address' },
        { status: 400, headers: { 'X-Request-Id': requestId } }
      );
    }

    if (!['native', 'stablecoin'].includes(feePaymentMethod)) {
      logger.logError(400, 'Invalid feePaymentMethod: must be "native" or "stablecoin"');
      return NextResponse.json(
        { error: 'Invalid feePaymentMethod: must be "native" or "stablecoin"' },
        { status: 400, headers: { 'X-Request-Id': requestId } }
      );
    }

    // Initialize Allbridge SDK
    const { AllbridgeCoreSdk, nodeRpcUrlsDefault, Messenger, FeePaymentMethod } = await import('@allbridge/bridge-core-sdk');

    const sdk = new AllbridgeCoreSdk({
      ...nodeRpcUrlsDefault,
      ...(env.public.NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL && {
        SRB: env.public.NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL,
      }),
    });

    // Fetch chain details and tokens
    const chainDetails = await sdk.chainDetailsMap();

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
      logger.logError(500, 'Failed to fetch chain details from Allbridge');
      return NextResponse.json(
        { error: 'Failed to fetch chain details from Allbridge' },
        { status: 500, headers: { 'X-Request-Id': requestId } }
      );
    }

    // Find USDC tokens
    const sourceToken = stellarChain.tokens.find((t: any) => t.symbol === 'USDC');
    const destinationToken = baseChain.tokens.find((t: any) => t.symbol === 'USDC');

    if (!sourceToken || !destinationToken) {
      logger.logError(500, 'USDC token not found on one or both chains');
      return NextResponse.json(
        { error: 'USDC token not found on one or both chains' },
        { status: 500, headers: { 'X-Request-Id': requestId } }
      );
    }

    // Get fee options
    const feeOptions = await sdk.getGasFeeOptions(sourceToken, destinationToken, Messenger.ALLBRIDGE);

    // Select fee based on payment method
    const gasFeePaymentMethod = feePaymentMethod === 'native'
      ? FeePaymentMethod.WITH_NATIVE_CURRENCY
      : FeePaymentMethod.WITH_STABLECOIN;
    const selectedFee = feePaymentMethod === 'native'
      ? (feeOptions as any).native?.float ?? (feeOptions as any)[FeePaymentMethod.WITH_NATIVE_CURRENCY]?.float
      : (feeOptions as any).stablecoin?.float ?? (feeOptions as any)[FeePaymentMethod.WITH_STABLECOIN]?.float;

    // Build raw transaction
    const rawTx = await sdk.bridge.rawTxBuilder.send({
      amount,
      fromAccountAddress: fromAddress,
      toAccountAddress: toAddress,
      sourceToken,
      destinationToken,
      messenger: Messenger.ALLBRIDGE,
      fee: selectedFee ? String(selectedFee) : undefined,
      gasFeePaymentMethod,
    });

    // rawTx for Stellar/Soroban is an XDR string
    const xdr = typeof rawTx === 'string' ? rawTx : (rawTx as any).toXDR?.() ?? JSON.stringify(rawTx);

    const response = NextResponse.json({
      xdr,
      sourceToken: {
        symbol: sourceToken.symbol,
        decimals: sourceToken.decimals,
        contract: sourceToken.contract,
        chain: sourceToken.chain,
      },
      destinationToken: {
        symbol: destinationToken.symbol,
        decimals: destinationToken.decimals,
        contract: destinationToken.contract,
        chain: destinationToken.chain,
      },
    });
    response.headers.set('X-Request-Id', requestId);
    logger.logSuccess(200);
    return response;
  } catch (error: any) {
    console.error('Build TX error:', error);

    const message = extractErrorMessage(error);

    // Parse common simulation errors
    if (message.includes('resulting balance is not within the allowed range')) {
      const userFriendly = "Insufficient XLM balance for native gas fee. Your remaining XLM would fall below Stellar's minimum account reserve. Switch to USDC fee payment or add more XLM.";
      logger.logError(500, userFriendly);
      return NextResponse.json(
        { error: userFriendly },
        { status: 500, headers: { 'X-Request-Id': requestId } }
      );
    }

    if (message.includes('contract call failed') && message.includes('transfer')) {
      const userFriendly = "A token transfer in the bridge contract failed during simulation. This usually means insufficient balance for the amount + fees.";
      logger.logError(500, userFriendly);
      return NextResponse.json(
        { error: userFriendly },
        { status: 500, headers: { 'X-Request-Id': requestId } }
      );
    }

    // Generic simulation error handling
    if (message.includes('Simulation failed')) {
      logger.logError(500, message);
      return NextResponse.json(
        { error: message },
        { status: 500, headers: { 'X-Request-Id': requestId } }
      );
    }

    if (message.includes('Invalid')) {
      logger.logError(400, message);
      return NextResponse.json(
        { error: message },
        { status: 400, headers: { 'X-Request-Id': requestId } }
      );
    }

    logger.logError(500, message);
    return NextResponse.json(
      { error: 'Failed to build transaction' },
      { status: 500, headers: { 'X-Request-Id': requestId } }
    );
  }
}
