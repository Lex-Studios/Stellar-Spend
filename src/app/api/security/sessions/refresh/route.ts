import { NextRequest, NextResponse } from "next/server";
import { sessionManagementService } from "@/lib/session-management";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token required" },
        { status: 400 },
      );
    }

    const session = await sessionManagementService.refreshSession(refreshToken);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 },
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    logger.error("Failed to refresh session", { error });
    return NextResponse.json(
      { error: "Failed to refresh session" },
      { status: 500 },
    );
  }
}
