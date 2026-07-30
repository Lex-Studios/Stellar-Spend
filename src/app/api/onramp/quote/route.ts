import { NextResponse, type NextRequest } from "next/server";
import { onrampService } from "@/lib/services/onramp.service";
import { isSupportedCurrency } from "@/lib/currencies";
import { getCachedQuote } from "@/lib/cache";

export const maxDuration = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fiatAmount,
      fiatCurrency,
      destinationToken,
      destinationAddress,
      provider,
    } = body;

    if (!fiatAmount || parseFloat(fiatAmount) <= 0) {
      return NextResponse.json(
        { error: "Invalid fiatAmount" },
        { status: 400 },
      );
    }

    if (!fiatCurrency || !isSupportedCurrency(fiatCurrency)) {
      return NextResponse.json(
        { error: `Unsupported currency: ${fiatCurrency}` },
        { status: 400 },
      );
    }

    if (!destinationToken) {
      return NextResponse.json(
        { error: "destinationToken is required" },
        { status: 400 },
      );
    }

    if (!destinationAddress) {
      return NextResponse.json(
        { error: "destinationAddress is required" },
        { status: 400 },
      );
    }

    const quote = await getCachedQuote(
      fiatAmount,
      fiatCurrency,
      destinationToken,
      () =>
        onrampService.getQuote({
          fiatAmount,
          fiatCurrency,
          destinationToken,
          destinationAddress,
          provider,
        }),
    );

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Onramp quote error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
