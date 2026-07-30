import { NextResponse, type NextRequest } from "next/server";
import { validateAmount } from "@/lib/offramp/utils/validation";
import { calculateBridgeAmount } from "@/lib/offramp/utils/quote-fetcher";
import { aggregateQuotes, type QuoteProvider } from "@/lib/quote-aggregator";

export const maxDuration = 20;

const STABLECOIN_FEE = "0.5";

const FEE_METHOD_MAP: Record<string, "stablecoin" | "native"> = {
  USDC: "stablecoin",
  stablecoin: "stablecoin",
  XLM: "native",
  native: "native",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, feeMethod, providers } = body;

    if (!validateAmount(String(amount ?? ""))) {
      return NextResponse.json(
        { error: "Invalid amount: must be a positive number" },
        { status: 400 },
      );
    }

    if (!currency || typeof currency !== "string") {
      return NextResponse.json(
        { error: "currency is required" },
        { status: 400 },
      );
    }

    const normalizedFee = FEE_METHOD_MAP[feeMethod];
    if (!normalizedFee) {
      return NextResponse.json(
        { error: 'feeMethod must be "USDC", "XLM", "stablecoin", or "native"' },
        { status: 400 },
      );
    }

    const bridgeAmount =
      normalizedFee === "stablecoin"
        ? calculateBridgeAmount(String(amount), "stablecoin", STABLECOIN_FEE)
        : String(amount);

    // Get bridge receive amount (simplified - in production, call Allbridge SDK)
    const receiveAmount = bridgeAmount;

    // Aggregate quotes from multiple providers
    const providerList: QuoteProvider[] = providers || ["paycrest"];
    const aggregatedQuotes = await aggregateQuotes(
      receiveAmount,
      currency,
      providerList,
    );

    if (!aggregatedQuotes.bestQuote) {
      return NextResponse.json(
        { error: "No quotes available from any provider" },
        { status: 502 },
      );
    }

    return NextResponse.json(aggregatedQuotes);
  } catch (error) {
    console.error("Quote aggregation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Invalid") || message.includes("less than")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to aggregate quotes" },
      { status: 500 },
    );
  }
}
