import { NextRequest, NextResponse } from "next/server";
import { ipWhitelistService } from "@/lib/ip-whitelist";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const userAddress = request.headers.get("x-user-address");
    if (!userAddress) {
      return NextResponse.json(
        { error: "User address required" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const violations = await ipWhitelistService.getViolations(userAddress, limit);
    return NextResponse.json({ violations });
  } catch (error) {
    logger.error("Failed to fetch IP violations", { error });
    return NextResponse.json(
      { error: "Failed to fetch IP violations" },
      { status: 500 },
    );
  }
}
