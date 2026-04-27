import { NextRequest, NextResponse } from "next/server";
import { sessionManagementService } from "@/lib/session-management";
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
    const { sessionId, revokeAll, reason } = body;

    if (revokeAll) {
      await sessionManagementService.revokeAllUserSessions(userAddress, reason);
      return NextResponse.json({ success: true, message: "All sessions revoked" });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID or revokeAll flag required" },
        { status: 400 },
      );
    }

    await sessionManagementService.revokeSession(sessionId, reason);
    return NextResponse.json({ success: true, message: "Session revoked" });
  } catch (error) {
    logger.error("Failed to revoke session", { error });
    return NextResponse.json(
      { error: "Failed to revoke session" },
      { status: 500 },
    );
  }
}
