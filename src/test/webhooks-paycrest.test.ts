import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/dal", () => ({
  dal: {
    getByPayoutOrderId: vi.fn().mockResolvedValue(null),
    update: vi.fn(),
    getById: vi.fn(),
  },
  DatabaseError: class DatabaseError extends Error {},
}));

vi.mock("@/lib/webhook/dispatcher", () => ({
  enqueue: vi.fn().mockResolvedValue(undefined),
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

vi.mock("@/lib/env", () => ({
  env: {
    server: {
      PAYCREST_WEBHOOK_SECRET: "test-webhook-secret",
      PAYCREST_API_KEY: "test-api-key",
      BASE_PRIVATE_KEY: "0xdeadbeef",
      BASE_RETURN_ADDRESS: "0xreturn",
      BASE_RPC_URL: "https://base-rpc.test",
      STELLAR_SOROBAN_RPC_URL: "https://soroban.test",
      STELLAR_HORIZON_URL: "https://horizon.test",
    },
    public: {
      NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL: "https://soroban.test",
      NEXT_PUBLIC_BASE_RETURN_ADDRESS: "0xreturn",
      NEXT_PUBLIC_STELLAR_USDC_ISSUER: "GISSUER",
    },
  },
}));

import { POST } from "@/app/api/webhooks/paycrest/route";
import { logger } from "@/lib/logger";

async function hmacHex(body: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return Buffer.from(mac).toString("hex");
}

function makeRequest(
  body: string,
  signature: string,
  timestamp?: string,
  nonce?: string,
): Request {
  const headers: Record<string, string> = {
    "X-Paycrest-Signature": signature,
  };
  if (timestamp) headers["X-Paycrest-Timestamp"] = timestamp;
  if (nonce) headers["X-Paycrest-Nonce"] = nonce;
  return new Request("http://localhost/api/webhooks/paycrest", {
    method: "POST",
    body,
    headers,
  });
}

describe("POST /api/webhooks/paycrest", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  it("returns 200 with valid signature, timestamp, and nonce", async () => {
    const body = JSON.stringify({
      event: "payment_order.settled",
      data: { id: "order-1" },
    });
    const sig = await hmacHex(body, "test-webhook-secret");
    const res = await POST(
      makeRequest(body, sig, String(Date.now()), "nonce-1"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
  });

  it("returns 200 with valid signature (backward compat without timestamp/nonce)", async () => {
    const body = JSON.stringify({
      event: "payment_order.settled",
      data: { id: "order-2" },
    });
    const sig = await hmacHex(body, "test-webhook-secret");
    const res = await POST(makeRequest(body, sig));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
  });

  it("returns 401 with invalid signature", async () => {
    const body = JSON.stringify({
      event: "payment_order.settled",
      data: { id: "order-1" },
    });
    const res = await POST(
      makeRequest(body, "bad-signature", String(Date.now()), "nonce-2"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when signature header is missing", async () => {
    const body = JSON.stringify({
      event: "payment_order.settled",
      data: { id: "order-1" },
    });
    const req = new Request("http://localhost/api/webhooks/paycrest", {
      method: "POST",
      body,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("rejects expired timestamp", async () => {
    const body = JSON.stringify({
      event: "payment_order.settled",
      data: { id: "order-3" },
    });
    const sig = await hmacHex(body, "test-webhook-secret");
    const oldTimestamp = String(Date.now() - 10 * 60 * 1000);
    const res = await POST(makeRequest(body, sig, oldTimestamp, "nonce-3"));
    expect(res.status).toBe(401);
  });

  it("detects and rejects replay attacks (same nonce)", async () => {
    const body = JSON.stringify({
      event: "payment_order.settled",
      data: { id: "order-replay" },
    });
    const sig = await hmacHex(body, "test-webhook-secret");
    const ts = String(Date.now());
    const nonce = "replay-nonce-test";
    const res1 = await POST(makeRequest(body, sig, ts, nonce));
    expect(res1.status).toBe(200);
    const res2 = await POST(makeRequest(body, sig, ts, nonce));
    expect(res2.status).toBe(401);
  });

  it("logs on unhandled event type", async () => {
    const body = JSON.stringify({
      event: "payment_order.unknown",
      data: { id: "order-99" },
    });
    const sig = await hmacHex(body, "test-webhook-secret");
    await POST(makeRequest(body, sig, String(Date.now()), "nonce-log"));
    expect(logger.warn).toHaveBeenCalledWith(
      "webhook.unhandled_event",
      expect.any(Object),
    );
  });
});
