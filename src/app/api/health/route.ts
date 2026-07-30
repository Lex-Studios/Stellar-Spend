import { NextResponse } from "next/server";
import { performHealthCheck } from "@/lib/health-check";

export const maxDuration = 30;

export async function GET() {
  try {
    const healthCheck = await performHealthCheck();
    const statusCode =
      healthCheck.status === "healthy"
        ? 200
        : healthCheck.status === "degraded"
          ? 200
          : 503;
    return NextResponse.json(healthCheck, { status: statusCode });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 503 },
    );
  }
}
