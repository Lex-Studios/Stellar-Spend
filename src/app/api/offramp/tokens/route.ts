import { NextRequest, NextResponse } from "next/server";
import {
  getActiveStablecoins,
  getStablecoinConfig,
  calculateStablecoinBridgeFee,
} from "@/lib/stablecoins";

/**
 * GET /api/offramp/tokens
 * Returns supported stablecoins and optionally calculates bridge fee for a given amount.
 *
 * Query params:
 *   ?symbol=USDT&amount=100  — get fee for a specific token + amount
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get("symbol");
  const amount = searchParams.get("amount");

  if (symbol) {
    const config = getStablecoinConfig(symbol);
    if (!config) {
      return NextResponse.json(
        { error: `Unsupported token: ${symbol}` },
        { status: 400 },
      );
    }
    const result: Record<string, unknown> = { token: config };
    if (amount) {
      result.bridgeFee = calculateStablecoinBridgeFee(symbol, amount);
      result.amountAfterFee = (
        parseFloat(amount) - parseFloat(result.bridgeFee as string)
      ).toFixed(6);
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ tokens: getActiveStablecoins() });
}
