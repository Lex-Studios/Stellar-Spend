import { NextResponse } from 'next/server';

export interface GasFeeOptions {
  native: { int: string; float: string } | null;
  stablecoin: { int: string; float: string } | null;
}

/**
 * GET /api/offramp/bridge/gas-fee-options
 * 
 * Fetches gas fee options from the bridge provider.
 * Returns native (XLM) and stablecoin (USDC) fee options.
 * 
 * The fees are typically:
 * - Native (XLM): network fees paid in XLM (small amount)
 * - Stablecoin: a percentage or fixed amount deducted from the bridged amount
 */
export async function GET(): Promise<NextResponse<GasFeeOptions | { error: string }>> {
  try {
    // TODO: Integrate with actual bridge provider when available
    // For now, we return estimated values based on typical Stellar network fees
    
    // Typical Stellar network fee is 0.00001 XLM per operation (min 1 operation)
    // Convert to USDC equivalent for display
    const nativeFeeInt = "100";  // 0.00001 XLM in stroops
    const nativeFeeFloat = "0.00001 XLM";
    
    // Stablecoin fee is typically a small percentage (e.g., 0.5%) or fixed amount
    // For USDC, this might be around $0.01-$0.50
    const stablecoinFeeInt = "1";  // $0.01 in cents
    const stablecoinFeeFloat = "$0.01";
    
    const result: GasFeeOptions = {
      native: {
        int: nativeFeeInt,
        float: nativeFeeFloat,
      },
      stablecoin: {
        int: stablecoinFeeInt,
        float: stablecoinFeeFloat,
      },
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching gas fee options:', error);
    
    // Return null values instead of error to avoid breaking the UI
    return NextResponse.json({
      native: null,
      stablecoin: null,
    });
  }
}
