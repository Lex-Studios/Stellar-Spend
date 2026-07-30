import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isStageStalled,
  STAGE_TIMEOUTS,
  SAFE_STAGES,
  UNSAFE_STAGES,
  handleStall,
  getTimeoutMetrics,
  resetTimeoutMetrics,
} from "./transaction-timeout";
import type { Transaction } from "./transaction-storage";

vi.mock("@/lib/db/dal", () => ({
  dal: {
    update: vi.fn().mockResolvedValue(undefined),
    getById: vi.fn(),
    getByUser: vi.fn(),
  },
}));

vi.mock("@/lib/refund/refund-service", () => ({
  processRefund: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/notifications/service", () => ({
  notifyTransactionStatusUpdate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    withContext: vi.fn().mockReturnThis(),
  },
}));

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-test-1",
    timestamp: Date.now() - 10000,
    userAddress: "GABCDEF123",
    amount: "100",
    currency: "USDC",
    beneficiary: {
      institution: "Test Bank",
      accountIdentifier: "12345",
      accountName: "Test User",
      currency: "USD",
    },
    status: "pending",
    ...overrides,
  };
}

describe("STAGE_TIMEOUTS", () => {
  it("defines timeouts for all trade stages", () => {
    expect(STAGE_TIMEOUTS.draft).toBe(10 * 60 * 1000);
    expect(STAGE_TIMEOUTS.bridge_pending).toBe(60 * 60 * 1000);
    expect(STAGE_TIMEOUTS.payout_pending).toBe(45 * 60 * 1000);
  });
});

describe("SAFE_STAGES / UNSAFE_STAGES", () => {
  it("marks early stages as safe for auto-retry", () => {
    expect(SAFE_STAGES.has("draft")).toBe(true);
    expect(SAFE_STAGES.has("quoted")).toBe(true);
    expect(SAFE_STAGES.has("source_tx_submitted")).toBe(true);
    expect(SAFE_STAGES.has("bridge_pending")).toBe(true);
  });

  it("marks late stages as requiring manual review", () => {
    expect(UNSAFE_STAGES.has("bridge_completed")).toBe(true);
    expect(UNSAFE_STAGES.has("payout_order_created")).toBe(true);
    expect(UNSAFE_STAGES.has("destination_tx_submitted")).toBe(true);
    expect(UNSAFE_STAGES.has("payout_pending")).toBe(true);
  });

  it("covers all stages with no overlap", () => {
    for (const stage of Object.keys(STAGE_TIMEOUTS) as Array<
      keyof typeof STAGE_TIMEOUTS
    >) {
      expect(SAFE_STAGES.has(stage) || UNSAFE_STAGES.has(stage)).toBe(true);
    }
  });
});

describe("isStageStalled", () => {
  beforeEach(() => {
    resetTimeoutMetrics();
  });

  it("detects bridge_pending stall", () => {
    const tx = makeTx({
      bridgeStatus: "pending",
      stellarTxHash: "0xabc",
      timestamp: Date.now() - STAGE_TIMEOUTS.bridge_pending - 1000,
    });
    const result = isStageStalled(tx);
    expect(result.stalled).toBe(true);
    expect(result.stage).toBe("bridge_pending");
    expect(result.stageTimeoutMs).toBe(STAGE_TIMEOUTS.bridge_pending);
  });

  it("does not flag non-stalled transaction", () => {
    const tx = makeTx({
      bridgeStatus: "pending",
      stellarTxHash: "0xabc",
      timestamp: Date.now() - 1000,
    });
    const result = isStageStalled(tx);
    expect(result.stalled).toBe(false);
  });

  it("detects payout_pending stall", () => {
    const tx = makeTx({
      payoutOrderId: "order-123",
      payoutStatus: "pending",
      timestamp: Date.now() - STAGE_TIMEOUTS.payout_pending - 1000,
    });
    const result = isStageStalled(tx);
    expect(result.stalled).toBe(true);
    expect(result.stage).toBe("payout_pending");
  });

  it("detects payout_order_created stall", () => {
    const tx = makeTx({
      bridgeStatus: "completed",
      payoutOrderId: "order-456",
      timestamp: Date.now() - STAGE_TIMEOUTS.payout_order_created - 1000,
    });
    const result = isStageStalled(tx);
    expect(result.stalled).toBe(true);
    expect(result.stage).toBe("payout_order_created");
  });

  it("returns unknown stage for transaction without bridge or payout", () => {
    const tx = makeTx({});
    const result = isStageStalled(tx);
    expect(result.stage).toBe("unknown");
    expect(result.stalled).toBe(false);
  });

  it("ignores completed transactions", () => {
    const tx = makeTx({
      status: "completed",
      bridgeStatus: "pending",
      timestamp: Date.now() - STAGE_TIMEOUTS.bridge_pending - 10000,
    });
    const result = isStageStalled(tx);
    expect(result.stalled).toBe(false);
  });
});

describe("getTimeoutMetrics", () => {
  beforeEach(() => {
    resetTimeoutMetrics();
  });

  it("returns initial zero metrics", () => {
    const metrics = getTimeoutMetrics();
    expect(metrics.stallsDetected).toBe(0);
    expect(metrics.autoRetried).toBe(0);
    expect(metrics.flaggedManual).toBe(0);
  });

  it("tracks stall detection", () => {
    const tx = makeTx({
      bridgeStatus: "pending",
      stellarTxHash: "0xabc",
      timestamp: Date.now() - STAGE_TIMEOUTS.bridge_pending - 1000,
    });
    isStageStalled(tx);
    expect(getTimeoutMetrics().stallsDetected).toBe(1);
  });
});

describe("handleStall", () => {
  beforeEach(() => {
    resetTimeoutMetrics();
    vi.clearAllMocks();
  });

  it("auto-retries safe stage (bridge_pending)", async () => {
    const { dal } = await import("@/lib/db/dal");
    const tx = makeTx({
      bridgeStatus: "pending",
      stellarTxHash: "0xabc",
      timestamp: Date.now() - STAGE_TIMEOUTS.bridge_pending - 1000,
    });
    const result = await handleStall(tx);
    expect(result.autoRetried).toBe(true);
    expect(result.flaggedManual).toBe(false);
    expect(dal.update).toHaveBeenCalledWith(
      tx.id,
      expect.objectContaining({ status: "pending" }),
    );
    expect(getTimeoutMetrics().autoRetried).toBe(1);
  });

  it("flags unsafe stage (payout_pending) for manual review", async () => {
    const { dal } = await import("@/lib/db/dal");
    const tx = makeTx({
      payoutOrderId: "order-789",
      payoutStatus: "pending",
      timestamp: Date.now() - STAGE_TIMEOUTS.payout_pending - 1000,
    });
    const result = await handleStall(tx);
    expect(result.autoRetried).toBe(false);
    expect(result.flaggedManual).toBe(true);
    expect(dal.update).not.toHaveBeenCalled();
    expect(getTimeoutMetrics().flaggedManual).toBe(1);
  });

  it("does nothing for non-stalled transaction", async () => {
    const { dal } = await import("@/lib/db/dal");
    const tx = makeTx({
      bridgeStatus: "pending",
      stellarTxHash: "0xabc",
      timestamp: Date.now() - 1000,
    });
    const result = await handleStall(tx);
    expect(result.stalled).toBe(false);
    expect(result.autoRetried).toBe(false);
    expect(result.flaggedManual).toBe(false);
    expect(dal.update).not.toHaveBeenCalled();
  });
});
