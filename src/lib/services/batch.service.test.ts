import { describe, it, expect, vi, beforeEach } from "vitest";
import { BatchService } from "./batch.service";

describe("BatchService", () => {
  let service: BatchService;

  beforeEach(() => {
    service = new BatchService();
  });

  describe("createBatch", () => {
    it("should create batch with valid transactions", async () => {
      const batch = await service.createBatch([
        {
          amount: "100",
          currency: "NGN",
          beneficiary: {
            accountNumber: "1234567890",
            bankCode: "044",
            name: "John Doe",
          },
        },
        {
          amount: "200",
          currency: "NGN",
          beneficiary: {
            accountNumber: "0987654321",
            bankCode: "044",
            name: "Jane Doe",
          },
        },
      ]);

      expect(batch).toBeDefined();
      expect(batch.batchId).toBeDefined();
      expect(batch.transactions).toHaveLength(2);
    });

    it("should throw for empty batch", async () => {
      await expect(service.createBatch([])).rejects.toThrow();
    });

    it("should throw for batch exceeding max size", async () => {
      const transactions = Array(101).fill({
        amount: "100",
        currency: "NGN",
        beneficiary: {
          accountNumber: "1234567890",
          bankCode: "044",
          name: "John Doe",
        },
      });

      await expect(service.createBatch(transactions)).rejects.toThrow();
    });

    it("should validate all transactions", async () => {
      await expect(
        service.createBatch([
          {
            amount: "-100",
            currency: "NGN",
            beneficiary: {
              accountNumber: "1234567890",
              bankCode: "044",
              name: "John Doe",
            },
          },
        ]),
      ).rejects.toThrow();
    });
  });

  describe("getBatchStatus", () => {
    it("should return batch status", async () => {
      const status = await service.getBatchStatus("batch-123");
      expect(status).toBeDefined();
      expect(["pending", "processing", "completed", "failed"]).toContain(
        status.status,
      );
    });

    it("should throw for invalid batch ID", async () => {
      await expect(service.getBatchStatus("")).rejects.toThrow();
    });
  });

  describe("processBatch", () => {
    it("should process batch successfully", async () => {
      const batch = await service.createBatch([
        {
          amount: "100",
          currency: "NGN",
          beneficiary: {
            accountNumber: "1234567890",
            bankCode: "044",
            name: "John Doe",
          },
        },
      ]);

      const result = await service.processBatch(batch.batchId);
      expect(result.status).toBe("processing");
    });
  });
});
