import { describe, it, expect } from "vitest";

interface ProviderQuote {
  destinationAmount: string;
  rate: number;
  currency: string;
  bridgeFee: string;
  payoutFee: string;
  estimatedTime: number;
  provider: string;
  success: boolean;
  error?: string;
  responseTime?: number;
  reliability?: number;
  netPayout?: number;
}

function rankQuotes(quotes: ProviderQuote[]): ProviderQuote[] {
  const successfulQuotes = quotes.filter((q) => q.success);

  if (successfulQuotes.length === 0) return quotes;

  return successfulQuotes.sort((a, b) => {
    const netA = a.netPayout ?? parseFloat(a.destinationAmount);
    const netB = b.netPayout ?? parseFloat(b.destinationAmount);

    if (netB !== netA) return netB - netA;

    const relA = a.reliability ?? 1.0;
    const relB = b.reliability ?? 1.0;
    if (relB !== relA) return relB - relA;

    return (a.responseTime || 0) - (b.responseTime || 0);
  });
}

function selectBestQuote(quotes: ProviderQuote[]): ProviderQuote | null {
  const successful = quotes.filter((q) => q.success);
  if (successful.length === 0) return null;
  const ranked = rankQuotes(quotes);
  return ranked.length > 0 ? ranked[0] : null;
}

describe("quote aggregator ranking", () => {
  it("ranks by net payout descending", () => {
    const quotes: ProviderQuote[] = [
      {
        provider: "paycrest",
        success: true,
        destinationAmount: "100",
        rate: 1500,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 300,
        netPayout: 100,
        reliability: 0.95,
        responseTime: 200,
      },
      {
        provider: "allbridge",
        success: true,
        destinationAmount: "110",
        rate: 1600,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 300,
        netPayout: 110,
        reliability: 0.9,
        responseTime: 300,
      },
    ];

    const ranked = rankQuotes(quotes);
    expect(ranked[0].provider).toBe("allbridge");
    expect(ranked[1].provider).toBe("paycrest");
  });

  it("uses reliability as tiebreaker when net payout is equal", () => {
    const quotes: ProviderQuote[] = [
      {
        provider: "paycrest",
        success: true,
        destinationAmount: "100",
        rate: 1500,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 300,
        netPayout: 100,
        reliability: 0.95,
        responseTime: 200,
      },
      {
        provider: "allbridge",
        success: true,
        destinationAmount: "100",
        rate: 1500,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 300,
        netPayout: 100,
        reliability: 0.85,
        responseTime: 150,
      },
    ];

    const ranked = rankQuotes(quotes);
    expect(ranked[0].provider).toBe("paycrest");
    expect(ranked[1].provider).toBe("allbridge");
  });

  it("uses response time as final tiebreaker", () => {
    const quotes: ProviderQuote[] = [
      {
        provider: "paycrest",
        success: true,
        destinationAmount: "100",
        rate: 1500,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 300,
        netPayout: 100,
        reliability: 0.95,
        responseTime: 300,
      },
      {
        provider: "allbridge",
        success: true,
        destinationAmount: "100",
        rate: 1500,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 300,
        netPayout: 100,
        reliability: 0.95,
        responseTime: 100,
      },
    ];

    const ranked = rankQuotes(quotes);
    expect(ranked[0].provider).toBe("allbridge");
    expect(ranked[1].provider).toBe("paycrest");
  });

  it("filters out failed quotes from top rankings", () => {
    const quotes: ProviderQuote[] = [
      {
        provider: "paycrest",
        success: true,
        destinationAmount: "100",
        rate: 1500,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 300,
        netPayout: 100,
      },
      {
        provider: "allbridge",
        success: false,
        destinationAmount: "0",
        rate: 0,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 0,
        error: "Timeout",
        netPayout: 0,
      },
    ];

    const best = selectBestQuote(quotes);
    expect(best).not.toBeNull();
    expect(best!.provider).toBe("paycrest");
    expect(best!.success).toBe(true);
  });

  it("returns null when all quotes fail", () => {
    const quotes: ProviderQuote[] = [
      {
        provider: "paycrest",
        success: false,
        destinationAmount: "0",
        rate: 0,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 0,
        error: "Error",
        netPayout: 0,
      },
      {
        provider: "allbridge",
        success: false,
        destinationAmount: "0",
        rate: 0,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 0,
        error: "Error",
        netPayout: 0,
      },
    ];

    const best = selectBestQuote(quotes);
    expect(best).toBeNull();
  });

  it("handles missing netPayout gracefully", () => {
    const quotes: ProviderQuote[] = [
      {
        provider: "paycrest",
        success: true,
        destinationAmount: "200",
        rate: 1500,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 300,
      },
      {
        provider: "allbridge",
        success: true,
        destinationAmount: "100",
        rate: 1500,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 300,
      },
    ];

    const best = selectBestQuote(quotes);
    expect(best).not.toBeNull();
    expect(best!.provider).toBe("paycrest");
  });

  it("sorts alternatives correctly", () => {
    const quotes: ProviderQuote[] = [
      {
        provider: "a",
        success: true,
        destinationAmount: "100",
        rate: 1500,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 300,
        netPayout: 100,
      },
      {
        provider: "b",
        success: true,
        destinationAmount: "90",
        rate: 1500,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 300,
        netPayout: 90,
      },
      {
        provider: "c",
        success: true,
        destinationAmount: "95",
        rate: 1500,
        currency: "NGN",
        bridgeFee: "0",
        payoutFee: "0",
        estimatedTime: 300,
        netPayout: 95,
      },
    ];

    const best = selectBestQuote(quotes);
    expect(best!.provider).toBe("a");

    const alternatives = quotes
      .filter((q) => q.success && q.provider !== best!.provider)
      .sort((a, b) => (b.netPayout ?? 0) - (a.netPayout ?? 0));

    expect(alternatives[0].provider).toBe("c");
    expect(alternatives[1].provider).toBe("b");
  });
});
