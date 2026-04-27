import { NextRequest, NextResponse } from "next/server";
import { sessionManagementService } from "@/lib/session-management";
import { logger } from "@/lib/logger";

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
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

    const clientIP = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || undefined;

    const session = await sessionManagementService.createSession(
      userAddress,
      clientIP,
      userAgent,
    );

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    logger.error("Failed to create session", { error });
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userAddress = request.headers.get("x-user-address");
    if (!userAddress) {
      return NextResponse.json(
        { error: "User address required" },
        { status: 400 },
      );
    }

    const sessions = await sessionManagementService.getUserSessions(userAddress);
    return NextResponse.json({ sessions });
  } catch (error) {
    logger.error("Failed to fetch sessions", { error });
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 },
    );
  }
}
