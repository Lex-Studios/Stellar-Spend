import { AllbridgeCoreSdk, nodeRpcUrlsDefault, ChainDetailsMap, TokenWithChainDetails } from '@allbridge/bridge-core-sdk';

/**
 * Initialize the Allbridge Core SDK with proper RPC URLs
 * Maps environment variables to the correct chain keys
 */
export function initializeAllbridgeSdk(): AllbridgeCoreSdk {
  const rpcUrls = { ...nodeRpcUrlsDefault };

  // Map Soroban RPC URL to SRB (Soroban chain key)
  const sorobanRpcUrl = process.env.STELLAR_SOROBAN_RPC_URL;
  if (sorobanRpcUrl) {
    rpcUrls.SRB = sorobanRpcUrl;
    console.log(`[Allbridge SDK] Using Soroban RPC: ${sorobanRpcUrl}`);
  }

  // Map Horizon URL to STLR (Stellar chain key)
  const horizonUrl = process.env.STELLAR_HORIZON_URL;
  if (horizonUrl) {
    rpcUrls.STLR = horizonUrl;
    console.log(`[Allbridge SDK] Using Horizon URL: ${horizonUrl}`);
  }

  // Legacy fallback for STELLAR_RPC_URL
  const legacyRpcUrl = process.env.STELLAR_RPC_URL;
  if (legacyRpcUrl && !sorobanRpcUrl && !horizonUrl) {
    // Detect if it's a Horizon URL (contains 'horizon') or Soroban RPC
    if (legacyRpcUrl.includes('horizon')) {
      rpcUrls.STLR = legacyRpcUrl;
      console.log(`[Allbridge SDK] Using legacy RPC as Horizon: ${legacyRpcUrl}`);
    } else {
      rpcUrls.SRB = legacyRpcUrl;
      console.log(`[Allbridge SDK] Using legacy RPC as Soroban: ${legacyRpcUrl}`);
    }
  }

  return new AllbridgeCoreSdk(rpcUrls);
}

interface AllbridgeTokenInfo {
  chain: ChainDetailsMap[string];
  usdc: TokenWithChainDetails;
}

/**
 * Fetch Stellar and Base USDC token information from Allbridge SDK
 */
export async function getAllbridgeTokens(sdk: AllbridgeCoreSdk): Promise<{
  stellar: AllbridgeTokenInfo;
  base: AllbridgeTokenInfo;
}> {
  const chainDetailsMap = await sdk.chainDetailsMap();

  // Extract Stellar chain (SRB) and find USDC token
  const stellarChain = chainDetailsMap.SRB;
  if (!stellarChain) {
    throw new Error('Stellar chain (SRB) not found in Allbridge chain details');
  }
  const stellarUsdc = stellarChain.tokens.find((token) => token.symbol === 'USDC');
  if (!stellarUsdc) {
    throw new Error('USDC token not found on Stellar chain');
  }

  // Extract Base chain (BAS) and find USDC token
  const baseChain = chainDetailsMap.BAS;
  if (!baseChain) {
    throw new Error('Base chain (BAS) not found in Allbridge chain details');
  }
  const baseUsdc = baseChain.tokens.find((token) => token.symbol === 'USDC');
  if (!baseUsdc) {
    throw new Error('USDC token not found on Base chain');
  }

  return {
    stellar: { chain: stellarChain, usdc: stellarUsdc },
    base: { chain: baseChain, usdc: baseUsdc },
  };
}

/**
 * Get bridge quote with receive amount, fee, and estimated time
 */
export async function getAllbridgeQuote(
  sdk: AllbridgeCoreSdk,
  sourceToken: TokenWithChainDetails,
  destinationToken: TokenWithChainDetails,
  amount: string
): Promise<{
  receiveAmount: string;
  fee: string;
  estimatedTime: number;
}> {
  // Get the amount to be received after bridge fees
  const amountToBeReceived = await sdk.getAmountToBeReceived(
    amount,
    sourceToken,
    destinationToken
  );

  // Calculate fee as difference between sent and received amounts
  const fee = (parseFloat(amount) - parseFloat(amountToBeReceived)).toString();

  // Get estimated transfer time in milliseconds
  const estimatedTime = await sdk.getAverageTransferTime(
    sourceToken,
    destinationToken,
    Messenger.ALLBRIDGE
  );

  return {
    receiveAmount: amountToBeReceived,
    fee,
    estimatedTime,
  };
}
