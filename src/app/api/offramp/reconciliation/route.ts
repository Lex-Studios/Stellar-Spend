import { NextResponse, type NextRequest } from "next/server";
import {
  generateReconciliationReport,
  buildSettlementCsv,
  buildDailySettlementReport,
  type ReconciliationRecord,
} from "@/lib/reconciliation";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records, format } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "records array is required and must not be empty" },
        { status: 400 },
      );
    }

    for (const record of records) {
      if (!record.transactionId) {
        return NextResponse.json(
          { error: "Each record must have a transactionId" },
          { status: 400 },
        );
      }
    }

    if (format === "csv") {
      const report = await generateReconciliationReport(
        records as ReconciliationRecord[],
      );
      const csv = buildSettlementCsv(report);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="reconciliation-${report.date}.csv"`,
        },
      });
    }

    if (format === "daily") {
      const daily = await buildDailySettlementReport(
        records as ReconciliationRecord[],
      );
      return NextResponse.json(daily);
    }

    const report = await generateReconciliationReport(
      records as ReconciliationRecord[],
    );
    return NextResponse.json(report);
  } catch (error) {
    logger.error("reconciliation.error", {}, error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate reconciliation report",
      },
      { status: 500 },
    );
  }
}
