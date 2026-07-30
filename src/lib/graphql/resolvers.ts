import { getRecordsByStatus, getRecord } from "../webhook/delivery-store";
import { list as listDLQ, replay as replayDLQ } from "../webhook/dlq";
import { updateRecord } from "../webhook/delivery-store";
import { requireRole } from "./auth-guards";

// ─── Context ────────────────────────────────────────────────────────────────

export interface GraphQLContext {
  userId?: string;
  isPremium?: boolean;
  isAuthenticated: boolean;
  role?: "user" | "admin" | "ops";
}

// ─── Query Resolvers ─────────────────────────────────────────────────────────

const Query = {
  async transaction(_: unknown, { id }: { id: string }, ctx: GraphQLContext) {
    requireAuth(ctx);
    const { getTransactionById } = await import("../db/dal");
    return getTransactionById(id);
  },

  async transactions(
    _: unknown,
    {
      limit = 20,
      offset = 0,
      status,
      currency,
    }: { limit?: number; offset?: number; status?: string; currency?: string },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    const { getTransactions } = await import("../db/dal");
    return getTransactions({ limit, offset, status, currency });
  },

  async quote(
    _: unknown,
    {
      amount,
      currency,
      feeMethod = "USDC",
    }: { amount: string; currency: string; feeMethod?: string },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    const { getQuote } = await import("../services/quote.service");
    return getQuote({ amount, currency, feeMethod });
  },

  async currencies(_: unknown, __: unknown, ctx: GraphQLContext) {
    requireAuth(ctx);
    const { getCurrencies } = await import("../currencies");
    return getCurrencies();
  },

  async institutions(
    _: unknown,
    { currency }: { currency: string },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    const { getInstitutions } = await import("../currencies");
    return getInstitutions(currency);
  },

  async rate(
    _: unknown,
    { currency = "NGN" }: { currency?: string },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    const { getRate } = await import("../services/quote.service");
    const rate = await getRate(currency);
    return { rate, currency, updatedAt: new Date().toISOString() };
  },

  // ─── Dispute queries ────────────────────────────────────────────────────────

  async dispute(_: unknown, { id }: { id: string }, ctx: GraphQLContext) {
    requireRole(ctx, "admin");
    const { getDisputeById } = await import("../repositories/dispute");
    return getDisputeById(id);
  },

  async disputes(
    _: unknown,
    { status, limit = 20 }: { status?: string; limit?: number },
    ctx: GraphQLContext,
  ) {
    requireRole(ctx, "admin");
    const { getDisputes } = await import("../repositories/dispute");
    return getDisputes({ status, limit });
  },

  // ─── Analytics queries ──────────────────────────────────────────────────────

  async analyticsSummary(
    _: unknown,
    { from, to }: { from?: string; to?: string },
    ctx: GraphQLContext,
  ) {
    requireRole(ctx, "admin");
    const { generateAnalyticsSummary } = await import("./analytics");
    return generateAnalyticsSummary(
      from ? parseInt(from) : undefined,
      to ? parseInt(to) : undefined,
    );
  },

  // ─── KYC queries ────────────────────────────────────────────────────────────

  async kycInfo(
    _: unknown,
    { userId }: { userId: string },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    const { KYCLimitService } = await import("../kyc-limits");
    const kyc = KYCLimitService.getKYC(userId);
    if (!kyc) return null;
    return {
      userId: kyc.userId,
      status: kyc.status,
      documentType: kyc.documentType,
      submittedAt: new Date(kyc.submittedAt).toISOString(),
      verifiedAt: kyc.verifiedAt
        ? new Date(kyc.verifiedAt).toISOString()
        : null,
      rejectionReason: kyc.rejectionReason,
    };
  },

  async userLimits(
    _: unknown,
    { userId }: { userId: string },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    const { KYCLimitService } = await import("../kyc-limits");
    const limits = KYCLimitService.getUserLimits(userId);
    if (!limits) return null;
    const { TIER_LIMITS } = await import("../kyc-limits");
    const tier = TIER_LIMITS[limits.tier as keyof typeof TIER_LIMITS];
    return {
      userId: limits.userId,
      tier: limits.tier,
      dailyLimit: tier.dailyLimit,
      monthlyLimit: tier.monthlyLimit,
      transactionLimit: tier.transactionLimit,
      dailyUsed: limits.dailyUsed,
      monthlyUsed: limits.monthlyUsed,
    };
  },

  // ─── Compliance queries ─────────────────────────────────────────────────────

  async screeningResult(
    _: unknown,
    { address }: { address: string },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    const { screenAddress } = await import("../compliance-screening");
    const result = await screenAddress({ address, addressType: "stellar" });
    return {
      verdict: result.verdict,
      score: result.score,
      flags: result.flags,
      provider: result.provider,
      screenedAt: new Date(result.screenedAt).toISOString(),
    };
  },

  async screeningOverrides(_: unknown, __: unknown, ctx: GraphQLContext) {
    requireRole(ctx, "ops");
    const { getScreeningOverrides } = await import("../compliance-screening");
    return getScreeningOverrides();
  },

  // ─── Webhook queries ────────────────────────────────────────────────────────

  async webhookDelivery(
    _: unknown,
    { id }: { id: string },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    return getRecord(id);
  },

  async webhookDeliveries(
    _: unknown,
    { status = "pending", limit = 50 }: { status?: string; limit?: number },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    const records = await getRecordsByStatus(
      status as "pending" | "delivered" | "failed",
    );
    return records.slice(0, limit);
  },

  async webhookStats(_: unknown, __: unknown, ctx: GraphQLContext) {
    requireAuth(ctx);
    const [pending, delivered, failed, dlqEntries] = await Promise.all([
      getRecordsByStatus("pending"),
      getRecordsByStatus("delivered"),
      getRecordsByStatus("failed"),
      listDLQ(),
    ]);
    return {
      pending: pending.length,
      delivered: delivered.length,
      failed: failed.length,
      dlqCount: dlqEntries.length,
    };
  },

  async dlqEntries(
    _: unknown,
    { limit = 50 }: { limit?: number },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    const entries = await listDLQ();
    return entries.slice(0, limit);
  },
};

// ─── Mutation Resolvers ───────────────────────────────────────────────────────

const Mutation = {
  async replayWebhook(
    _: unknown,
    { dlqEntryId }: { dlqEntryId: string },
    ctx: GraphQLContext,
  ) {
    requireRole(ctx, "admin");
    return replayDLQ(dlqEntryId);
  },

  async retryWebhookDelivery(
    _: unknown,
    { deliveryId }: { deliveryId: string },
    ctx: GraphQLContext,
  ) {
    requireRole(ctx, "admin");
    const record = await getRecord(deliveryId);
    if (!record) throw new Error(`Delivery ${deliveryId} not found`);
    return updateRecord(deliveryId, {
      status: "pending",
      nextAttemptAt: new Date().toISOString(),
    });
  },

  // ─── Dispute mutations ──────────────────────────────────────────────────────

  async createDispute(
    _: unknown,
    {
      transactionId,
      reason,
      evidence,
    }: { transactionId: string; reason: string; evidence?: string[] },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    const { createDispute } = await import("../repositories/dispute");
    return createDispute({
      transactionId,
      userId: ctx.userId!,
      reason,
      evidence,
    });
  },

  async resolveDispute(
    _: unknown,
    { id, resolution }: { id: string; resolution: string },
    ctx: GraphQLContext,
  ) {
    requireRole(ctx, "admin");
    const { resolveDispute } = await import("../repositories/dispute");
    return resolveDispute(id, resolution, ctx.userId!);
  },

  // ─── Screening override mutations ──────────────────────────────────────────

  async addScreeningOverride(
    _: unknown,
    {
      address,
      verdict,
      reason,
    }: { address: string; verdict: string; reason: string },
    ctx: GraphQLContext,
  ) {
    requireRole(ctx, "ops");
    const { addScreeningOverride } = await import("../compliance-screening");
    addScreeningOverride(address, verdict as any, reason, ctx.userId!);
    return true;
  },

  async removeScreeningOverride(
    _: unknown,
    { address }: { address: string },
    ctx: GraphQLContext,
  ) {
    requireRole(ctx, "ops");
    const { removeScreeningOverride } = await import("../compliance-screening");
    removeScreeningOverride(address);
    return true;
  },

  // ─── KYC mutations ──────────────────────────────────────────────────────────

  async submitKYC(
    _: unknown,
    {
      userId,
      documentType,
      documentId,
    }: { userId: string; documentType: string; documentId: string },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    const { KYCLimitService } = await import("../kyc-limits");
    const kyc = KYCLimitService.submitKYC(userId, documentType, documentId);
    return {
      userId: kyc.userId,
      status: kyc.status,
      documentType: kyc.documentType,
      submittedAt: new Date(kyc.submittedAt).toISOString(),
    };
  },

  async approveKYC(
    _: unknown,
    { userId }: { userId: string },
    ctx: GraphQLContext,
  ) {
    requireRole(ctx, "admin");
    const { KYCLimitService } = await import("../kyc-limits");
    const kyc = KYCLimitService.verifyKYC(userId);
    if (!kyc) throw new Error(`No KYC found for user ${userId}`);
    return {
      userId: kyc.userId,
      status: kyc.status,
      documentType: kyc.documentType,
      submittedAt: new Date(kyc.submittedAt).toISOString(),
      verifiedAt: kyc.verifiedAt
        ? new Date(kyc.verifiedAt).toISOString()
        : null,
    };
  },

  async rejectKYC(
    _: unknown,
    { userId, reason }: { userId: string; reason: string },
    ctx: GraphQLContext,
  ) {
    requireRole(ctx, "admin");
    const { KYCLimitService } = await import("../kyc-limits");
    const kyc = KYCLimitService.rejectKYC(userId, reason);
    if (!kyc) throw new Error(`No KYC found for user ${userId}`);
    return {
      userId: kyc.userId,
      status: kyc.status,
      documentType: kyc.documentType,
      submittedAt: new Date(kyc.submittedAt).toISOString(),
      rejectionReason: kyc.rejectionReason,
    };
  },
};

// ─── Subscription Resolvers ───────────────────────────────────────────────────

export const subscriptions = {
  transactionStatusChanged: {
    subscribe: async function* (_: unknown, { id }: { id: string }) {
      while (true) {
        await new Promise((r) => setTimeout(r, 5000));
        const { getTransactionById } = await import("../db/dal");
        const tx = await getTransactionById(id);
        if (tx) yield { transactionStatusChanged: tx };
      }
    },
  },

  rateUpdated: {
    subscribe: async function* (
      _: unknown,
      { currency = "NGN" }: { currency?: string },
    ) {
      while (true) {
        await new Promise((r) => setTimeout(r, 30000));
        const { getRate } = await import("../services/quote.service");
        const rate = await getRate(currency);
        yield {
          rateUpdated: { rate, currency, updatedAt: new Date().toISOString() },
        };
      }
    },
  },

  transactionCreated: {
    subscribe: async function* (_: unknown, __: unknown) {
      const seen = new Set<string>();
      while (true) {
        await new Promise((r) => setTimeout(r, 3000));
        const { getTransactions } = await import("../db/dal");
        const txs = await getTransactions({ limit: 10 });
        for (const tx of txs) {
          if (!seen.has(tx.id)) {
            seen.add(tx.id);
            yield { transactionCreated: tx };
          }
        }
      }
    },
  },

  disputeStatusChanged: {
    subscribe: async function* (_: unknown, { id }: { id: string }) {
      let lastStatus: string | null = null;
      while (true) {
        await new Promise((r) => setTimeout(r, 5000));
        try {
          const { getDisputeById } = await import("../repositories/dispute");
          const dispute = await getDisputeById(id);
          if (dispute && dispute.status !== lastStatus) {
            lastStatus = dispute.status;
            yield { disputeStatusChanged: dispute };
          }
        } catch {}
      }
    },
  },

  screeningAlert: {
    subscribe: async function* (_: unknown, { address }: { address: string }) {
      const { screenAddress } = await import("../compliance-screening");
      while (true) {
        await new Promise((r) => setTimeout(r, 60000));
        const result = await screenAddress({ address, addressType: "stellar" });
        yield {
          screeningAlert: {
            verdict: result.verdict,
            score: result.score,
            flags: result.flags,
            provider: result.provider,
            screenedAt: new Date(result.screenedAt).toISOString(),
          },
        };
      }
    },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function requireAuth(ctx: GraphQLContext): void {
  if (!ctx.isAuthenticated) {
    throw new Error("Unauthorized: authentication required");
  }
}

export const resolvers = { Query, Mutation };
