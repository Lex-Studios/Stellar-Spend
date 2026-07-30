import { NextRequest, NextResponse } from "next/server";
import { ipWhitelistService } from "@/lib/ip-whitelist";
import { logger } from "@/lib/logger";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { entryId: string } },
) {
  try {
    const userAddress = request.headers.get("x-user-address");
    if (!userAddress) {
      return NextResponse.json(
        { error: "User address required" },
        { status: 400 },
      );
    }

    const { entryId } = params;
    await ipWhitelistService.removeIPEntry(userAddress, entryId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to remove IP entry", { error });
    return NextResponse.json(
      { error: "Failed to remove IP entry" },
      { status: 500 },
    );
  }
}
