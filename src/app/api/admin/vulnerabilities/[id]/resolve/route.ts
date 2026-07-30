import { NextRequest, NextResponse } from "next/server";
import { vulnerabilityManager } from "@/lib/vulnerability-management";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const success = vulnerabilityManager.resolveVulnerability(id);

    if (!success) {
      return NextResponse.json(
        { error: "Vulnerability not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to resolve vulnerability", { error });
    return NextResponse.json(
      { error: "Failed to resolve vulnerability" },
      { status: 500 },
    );
  }
}
