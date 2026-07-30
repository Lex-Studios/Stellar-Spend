import { NextRequest, NextResponse } from "next/server";
import { TwoFAService } from "@/lib/two-fa";

export async function POST(req: NextRequest) {
  try {
    const { userId, code, method, secret, backupCodes } = await req.json();

    if (!userId || !code || !method) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (method === "totp") {
      if (!secret) {
        return NextResponse.json(
          { error: "Missing TOTP secret" },
          { status: 400 },
        );
      }

      const isValid = TwoFAService.verifyTOTP(secret, code);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid TOTP code" },
          { status: 401 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "2FA verified successfully",
        verified: true,
      });
    }

    if (method === "backup") {
      if (!backupCodes) {
        return NextResponse.json(
          { error: "Missing backup codes" },
          { status: 400 },
        );
      }

      const { isValid, remainingCodes } = TwoFAService.verifyBackupCode(
        backupCodes,
        [],
        code,
      );

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid backup code" },
          { status: 401 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Backup code verified",
        verified: true,
        remainingCodes,
      });
    }

    return NextResponse.json(
      { error: "Unsupported verification method" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
