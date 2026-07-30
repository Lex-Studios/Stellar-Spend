import { NextRequest, NextResponse } from "next/server";
import { TransactionStorage } from "@/lib/transaction-storage";
import { TransactionSearchService } from "@/lib/transaction-search";

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet");
    const query = req.nextUrl.searchParams.get("q");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "5");

    if (!wallet || !query) {
      return NextResponse.json(
        { error: "Missing wallet or query parameter" },
        { status: 400 },
      );
    }

    const userTransactions = TransactionStorage.getByUser(wallet);
    const suggestions = TransactionSearchService.getSearchSuggestions(
      userTransactions,
      query,
      limit,
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
