import { NextRequest, NextResponse } from "next/server";
import { ipWhitelistService } from "@/lib/ip-whitelist";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const userAddress = request.headers.get("x-user-address");
    if (!userAddress) {
      return NextResponse.json(
        { error: "User address required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { ipRangeStart, ipRangeEnd, label } = body;

    if (!ipRangeStart || !ipRangeEnd) {
      return NextResponse.json(
        { error: "IP range start and end required" },
        { status: 400 },
      );
    }

    const entry = await ipWhitelistService.addIPRange(
      userAddress,
      ipRangeStart,
      ipRangeEnd,
      label,
    );
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    logger.error("Failed to add IP range", { error });
    return NextResponse.json(
      { error: "Failed to add IP range" },
      { status: 500 },
    );
  }
}
