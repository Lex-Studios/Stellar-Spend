import { NextResponse } from "next/server";
import {
  getTransactionQueue,
  getDeliveryRetryQueue,
} from "@/lib/priority-queue";
import { list } from "@/lib/webhook/dlq";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const txMetrics = getTransactionQueue().getMetrics();
    const retryQueue = getDeliveryRetryQueue();

    const dlqEntries = await list().catch(() => []);
    retryQueue.updateDlqDepth(dlqEntries.length);

    const retryMetrics = retryQueue.getMetrics();

    return NextResponse.json({
      ok: true,
      metrics: {
        transactions: txMetrics,
        deliveryRetry: retryMetrics,
      },
    });
  } catch (err) {
    logger.error("metrics.fetch_failed", {}, err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch metrics" },
      { status: 500 },
    );
  }
}
