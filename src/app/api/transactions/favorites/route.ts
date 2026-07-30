import { NextRequest, NextResponse } from "next/server";
import { TransactionStorage } from "@/lib/transaction-storage";

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { error: "Missing wallet parameter" },
        { status: 400 },
      );
    }

    const favorites = TransactionStorage.getFavoritesByUser(wallet);
    return NextResponse.json(favorites);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { transactionId } = await req.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: "Missing transactionId" },
        { status: 400 },
      );
    }

    const tx = TransactionStorage.getById(transactionId);
    if (!tx) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    TransactionStorage.toggleFavorite(transactionId);

    return NextResponse.json({
      success: true,
      isFavorite: TransactionStorage.getById(transactionId)?.isFavorite,
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
