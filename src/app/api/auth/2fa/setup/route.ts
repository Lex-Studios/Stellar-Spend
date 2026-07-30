import { NextRequest, NextResponse } from "next/server";
import { TwoFAService } from "@/lib/two-fa";

const STORAGE_KEY = "stellar_spend_2fa_config";

export async function POST(req: NextRequest) {
  try {
    const { userId, method } = await req.json();

    if (!userId || !method || !["totp", "sms"].includes(method)) {
      return NextResponse.json(
        { error: "Invalid userId or method" },
        { status: 400 },
      );
    }

    if (method === "totp") {
      const secret = TwoFAService.generateTOTPSecret();
      const backupCodes = TwoFAService.generateBackupCodes();
      const uri = TwoFAService.generateTOTPURI(secret, userId);

      return NextResponse.json({
        secret,
        uri,
        backupCodes,
        method: "totp",
      });
    }

    if (method === "sms") {
      return NextResponse.json({
        method: "sms",
        message:
          "SMS 2FA setup initiated. Provide phone number in verification step.",
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
