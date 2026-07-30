import { NextResponse, type NextRequest } from "next/server";
import {
  generateReconciliationReport,
  generateAlerts,
  buildDailySettlementReport,
  type ReconciliationRecord,
} from "@/lib/reconciliation";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records, includeDaily } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "records array is required and must not be empty" },
        { status: 400 },
      );
    }

    const report = await generateReconciliationReport(
      records as ReconciliationRecord[],
    );
    const alerts = generateAlerts(report);

    const response: Record<string, unknown> = {
      alerts,
      summary: report.summary,
      timestamp: report.timestamp,
      date: report.date,
    };

    if (includeDaily) {
      const daily = await buildDailySettlementReport(
        records as ReconciliationRecord[],
      );
      response.daily = daily;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Alert generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate alerts",
      },
      { status: 500 },
    );
  }
}
