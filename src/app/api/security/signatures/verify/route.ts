import { NextRequest, NextResponse } from "next/server";
import { transactionSigningService } from "@/lib/transaction-signing";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signatureId } = body;

    if (!signatureId) {
      return NextResponse.json(
        { error: "signatureId is required" },
        { status: 400 },
      );
    }

    const isValid = await transactionSigningService.verifySignature(signatureId);
    const signature = await transactionSigningService.getSignatureStatus(signatureId);

    return NextResponse.json({
      signatureId,
      isValid,
      signature,
    });
  } catch (error) {
    logger.error("Failed to verify signature", { error });
    return NextResponse.json(
      { error: "Failed to verify signature" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const signatureId = searchParams.get("signatureId");

    if (!signatureId) {
      return NextResponse.json(
        { error: "signatureId query parameter required" },
        { status: 400 },
      );
    }

    const signature = await transactionSigningService.getSignatureStatus(signatureId);
    const logs = await transactionSigningService.getVerificationLogs(signatureId);

    if (!signature) {
      return NextResponse.json(
        { error: "Signature not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      signature,
      verificationLogs: logs,
    });
  } catch (error) {
    logger.error("Failed to fetch signature status", { error });
    return NextResponse.json(
      { error: "Failed to fetch signature status" },
      { status: 500 },
    );
  }
}
