import { NextRequest, NextResponse } from "next/server";
import { auditLoggingService } from "@/lib/audit-logging";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get("userAddress");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!userAddress) {
      return NextResponse.json(
        { error: "userAddress query parameter required" },
        { status: 400 },
      );
    }

    const logs = await auditLoggingService.getUserAuditLogs(userAddress, limit, offset);
    return NextResponse.json({ logs });
  } catch (error) {
    logger.error("Failed to fetch audit logs", { error });
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 },
    );
  }
}
