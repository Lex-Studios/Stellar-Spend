import { describe, it, expect } from "vitest";
import {
  mergeTransactionHistories,
  findDifferences,
} from "../transaction-merge";
import type { Transaction } from "../transaction-storage";

const createMockTransaction = (
  overrides?: Partial<Transaction>,
): Transaction => ({
  id: `tx_${Math.random()}`,
  timestamp: Date.now(),
  userAddress: "0x123",
  amount: "100",
  currency: "USDC",
  beneficiary: {
    institution: "Bank A",
    accountIdentifier: "123456",
    accountName: "John Doe",
    currency: "NGN",
  },
  status: "completed" as const,
  ...overrides,
});

describe("mergeTransactionHistories", () => {
  it("should merge transactions with no conflicts", () => {
    const tx1 = createMockTransaction({ id: "tx1" });
    const tx2 = createMockTransaction({ id: "tx2" });
    const tx3 = createMockTransaction({ id: "tx3" });

    const local = [tx1, tx2];
    const server = [tx3];

    const result = mergeTransactionHistories(local, server);

    expect(result.merged).toHaveLength(3);
    expect(result.conflicts).toHaveLength(0);
  });

  it("should resolve conflicts using last-write-wins (server newer)", () => {
    const localTx = createMockTransaction({
      id: "tx1",
      timestamp: 1000,
      finalizedAt: 1000,
      note: "local note",
    });

    const serverTx = createMockTransaction({
      id: "tx1",
      timestamp: 2000,
      finalizedAt: 2000,
      note: "server note",
    });

    const result = mergeTransactionHistories([localTx], [serverTx]);

    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].note).toBe("server note");
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].winner).toBe("server");
  });

  it("should resolve conflicts using last-write-wins (local newer)", () => {
    const localTx = createMockTransaction({
      id: "tx1",
      timestamp: 3000,
      finalizedAt: 3000,
      note: "local note",
    });

    const serverTx = createMockTransaction({
      id: "tx1",
      timestamp: 1000,
      finalizedAt: 1000,
      note: "server note",
    });

    const result = mergeTransactionHistories([localTx], [serverTx]);

    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].note).toBe("local note");
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].winner).toBe("local");
  });

  it("should merge metadata when timestamps are equal", () => {
    const timestamp = 2000;
    const localTx = createMockTransaction({
      id: "tx1",
      timestamp,
      finalizedAt: timestamp,
      note: "local note",
      isFavorite: true,
    });

    const serverTx = createMockTransaction({
      id: "tx1",
      timestamp,
      finalizedAt: timestamp,
      note: undefined,
      isFavorite: false,
      tags: [{ id: "tag1", name: "urgent", color: "#ff0000" }],
    });

    const result = mergeTransactionHistories([localTx], [serverTx]);

    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].note).toBe("local note");
    expect(result.merged[0].isFavorite).toBe(true);
    expect(result.merged[0].tags).toHaveLength(1);
  });

  it("should handle empty arrays", () => {
    const tx = createMockTransaction({ id: "tx1" });

    let result = mergeTransactionHistories([], []);
    expect(result.merged).toHaveLength(0);

    result = mergeTransactionHistories([tx], []);
    expect(result.merged).toHaveLength(1);

    result = mergeTransactionHistories([], [tx]);
    expect(result.merged).toHaveLength(1);
  });
});

describe("findDifferences", () => {
  it("should find transactions only on local", () => {
    const localTx = createMockTransaction({ id: "tx1" });
    const serverTx = createMockTransaction({ id: "tx2" });

    const result = findDifferences([localTx], [serverTx]);

    expect(result.onlyLocal).toHaveLength(1);
    expect(result.onlyLocal[0].id).toBe("tx1");
    expect(result.onlyServer).toHaveLength(1);
    expect(result.onlyServer[0].id).toBe("tx2");
  });

  it("should find modified transactions", () => {
    const id = "tx1";
    const local = createMockTransaction({
      id,
      status: "completed",
      note: "updated note",
      timestamp: 2000,
    });

    const server = createMockTransaction({
      id,
      status: "pending",
      note: "old note",
      timestamp: 1000,
    });

    const result = findDifferences([local], [server]);

    expect(result.modified).toHaveLength(1);
    expect(result.modified[0].local.note).toBe("updated note");
  });

  it("should return empty differences for identical transactions", () => {
    const tx = createMockTransaction({ id: "tx1" });

    const result = findDifferences([tx], [tx]);

    expect(result.onlyLocal).toHaveLength(0);
    expect(result.onlyServer).toHaveLength(0);
    expect(result.modified).toHaveLength(0);
  });
});
