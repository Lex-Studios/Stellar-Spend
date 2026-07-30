import { NextRequest, NextResponse } from "next/server";
import { auditLoggingService } from "@/lib/audit-logging";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const policy = await auditLoggingService.getRetentionPolicy();
    return NextResponse.json({ retentionDays: policy });
  } catch (error) {
    logger.error("Failed to fetch retention policy", { error });
    return NextResponse.json(
      { error: "Failed to fetch retention policy" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { retentionDays } = body;

    if (!retentionDays || retentionDays < 1) {
      return NextResponse.json(
        { error: "Invalid retention days" },
        { status: 400 },
      );
    }

    await auditLoggingService.setRetentionPolicy(retentionDays);
    return NextResponse.json({ success: true, retentionDays });
  } catch (error) {
    logger.error("Failed to set retention policy", { error });
    return NextResponse.json(
      { error: "Failed to set retention policy" },
      { status: 500 },
    );
  }
}
