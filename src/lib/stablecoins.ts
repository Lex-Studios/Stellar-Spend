/**
 * Supported stablecoin configuration for bridging.
 *
 * Each entry defines the token symbol, full name, decimals, and the
 * chain-specific contract/issuer addresses used by Allbridge.
 */

export interface StablecoinConfig {
  symbol: string;
  name: string;
  decimals: number;
  /** Allbridge token symbol used when querying the SDK */
  allbridgeSymbol: string;
  /** Fee percentage applied during bridging (0–100) */
  bridgeFeePercent: number;
  active: boolean;
}

export const SUPPORTED_STABLECOINS: StablecoinConfig[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    allbridgeSymbol: "USDC",
    bridgeFeePercent: 0.5,
    active: true,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    allbridgeSymbol: "USDT",
    bridgeFeePercent: 0.5,
    active: true,
  },
];

export function getStablecoinConfig(
  symbol: string,
): StablecoinConfig | undefined {
  return SUPPORTED_STABLECOINS.find(
    (s) => s.symbol === symbol.toUpperCase() && s.active,
  );
}

export function getActiveStablecoins(): StablecoinConfig[] {
  return SUPPORTED_STABLECOINS.filter((s) => s.active);
}

export function isSupportedStablecoin(symbol: string): boolean {
  return !!getStablecoinConfig(symbol);
}

/**
 * Calculate the bridge fee for a given stablecoin and amount.
 * Returns the fee as a string with 6 decimal places.
 */
export function calculateStablecoinBridgeFee(
  symbol: string,
  amount: string,
): string {
  const config = getStablecoinConfig(symbol);
  const amountNum = parseFloat(amount);
  if (!config || isNaN(amountNum) || amountNum <= 0) return "0";
  return ((amountNum * config.bridgeFeePercent) / 100).toFixed(6);
}
