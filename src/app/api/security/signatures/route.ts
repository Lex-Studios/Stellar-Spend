import { NextRequest, NextResponse } from "next/server";
import { transactionSigningService } from "@/lib/transaction-signing";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, userAddress, signature, publicKey, algorithm } = body;

    if (!transactionId || !userAddress || !signature || !publicKey) {
      return NextResponse.json(
        { error: "transactionId, userAddress, signature, and publicKey are required" },
        { status: 400 },
      );
    }

    const txSignature = await transactionSigningService.signTransaction(
      transactionId,
      userAddress,
      signature,
      publicKey,
      algorithm || "ed25519",
    );

    return NextResponse.json(txSignature, { status: 201 });
  } catch (error) {
    logger.error("Failed to sign transaction", { error });
    return NextResponse.json(
      { error: "Failed to sign transaction" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId query parameter required" },
        { status: 400 },
      );
    }

    const signatures = await transactionSigningService.getTransactionSignatures(
      transactionId,
    );

    return NextResponse.json({ signatures });
  } catch (error) {
    logger.error("Failed to fetch signatures", { error });
    return NextResponse.json(
      { error: "Failed to fetch signatures" },
      { status: 500 },
    );
  }
}
