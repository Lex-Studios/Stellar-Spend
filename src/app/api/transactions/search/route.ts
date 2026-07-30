import { NextRequest, NextResponse } from "next/server";
import { TransactionStorage } from "@/lib/transaction-storage";
import {
  TransactionSearchService,
  type SearchFilters,
} from "@/lib/transaction-search";

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet");
    const query = req.nextUrl.searchParams.get("q");
    const status = req.nextUrl.searchParams.get("status");
    const dateFrom = req.nextUrl.searchParams.get("dateFrom");
    const dateTo = req.nextUrl.searchParams.get("dateTo");
    const amountMin = req.nextUrl.searchParams.get("amountMin");
    const amountMax = req.nextUrl.searchParams.get("amountMax");
    const currency = req.nextUrl.searchParams.get("currency");
    const isFavorite = req.nextUrl.searchParams.get("isFavorite");

    if (!wallet) {
      return NextResponse.json(
        { error: "Missing wallet parameter" },
        { status: 400 },
      );
    }

    const userTransactions = TransactionStorage.getByUser(wallet);

    const filters: SearchFilters = {
      query: query || undefined,
      status: (status as any) || "all",
      dateFrom: dateFrom ? parseInt(dateFrom) : undefined,
      dateTo: dateTo ? parseInt(dateTo) : undefined,
      amountMin: amountMin ? parseFloat(amountMin) : undefined,
      amountMax: amountMax ? parseFloat(amountMax) : undefined,
      currency: currency || undefined,
      isFavorite: isFavorite ? isFavorite === "true" : undefined,
    };

    const results = TransactionSearchService.search(userTransactions, filters);

    return NextResponse.json({
      results,
      count: results.length,
      total: userTransactions.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
