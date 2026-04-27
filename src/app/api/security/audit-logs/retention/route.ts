import { NextRequest, NextResponse } from "next/server";
import { auditLoggingService } from "@/lib/audit-logging";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const retentionDays = await auditLoggingService.getRetentionPolicy();
    return NextResponse.json({ retentionDays });
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
    const adminAddress = request.headers.get("x-admin-address");
    if (!adminAddress) {
      return NextResponse.json(
        { error: "Admin address required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { retentionDays } = body;

    if (!retentionDays || retentionDays < 1) {
      return NextResponse.json(
        { error: "retentionDays must be at least 1" },
        { status: 400 },
      );
    }

    await auditLoggingService.setRetentionPolicy(retentionDays);

    // Log the admin action
    await auditLoggingService.logAdminAction(adminAddress, "UPDATE_RETENTION_POLICY", {
      actionDetails: `Retention policy updated to ${retentionDays} days`,
    });

    return NextResponse.json({ success: true, retentionDays });
  } catch (error) {
    logger.error("Failed to update retention policy", { error });
    return NextResponse.json(
      { error: "Failed to update retention policy" },
      { status: 500 },
    );
  }
}
