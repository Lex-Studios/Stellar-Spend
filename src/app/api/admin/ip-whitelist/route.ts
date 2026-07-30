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

    const entries = await ipWhitelistService.getWhitelistedIPs(userAddress);
    return NextResponse.json({ entries });
  } catch (error) {
    logger.error("Failed to fetch whitelisted IPs", { error });
    return NextResponse.json(
      { error: "Failed to fetch whitelisted IPs" },
      { status: 500 },
    );
  }
}

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
    const { ipAddress, label } = body;

    if (!ipAddress) {
      return NextResponse.json(
        { error: "IP address required" },
        { status: 400 },
      );
    }

    const entry = await ipWhitelistService.addIPAddress(
      userAddress,
      ipAddress,
      label,
    );
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    logger.error("Failed to add IP address", { error });
    return NextResponse.json(
      { error: "Failed to add IP address" },
      { status: 500 },
    );
  }
}
