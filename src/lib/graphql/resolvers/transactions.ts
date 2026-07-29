/**
 * GraphQL resolver module — transactions domain
 *
 * Covers: transaction queries, quote queries, currency/institution queries, rate queries,
 * and the corresponding subscriptions (transactionStatusChanged, rateUpdated,
 * transactionCreated).
 */

import type { GraphQLContext } from '../context';
import { requireAuth } from '../auth-guards';

// ─── Query Resolvers ──────────────────────────────────────────────────────────

export const transactionQueries = {
  async transaction(_: unknown, { id }: { id: string }, ctx: GraphQLContext) {
    requireAuth(ctx);
    const { getTransactionById } = await import('../../db/dal');
    return getTransactionById(id);
  },

  async transactions(
    _: unknown,
    {
      limit = 20,
      cursor,
      status,
      currency,
    }: {
      limit?: number;
      cursor?: string;
      status?: string;
      currency?: string;
    },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    const { decodeCursor, encodeOffsetCursor, decodeOffsetCursor } = await import('../../pagination');
    const offset = cursor ? decodeOffsetCursor(cursor) : 0;
    const clampedLimit = Math.min(Math.max(limit, 1), 200);
    const { getTransactions } = await import('../../db/dal');
    const items = await getTransactions({ limit: clampedLimit + 1, offset, status, currency });
    const hasMore = items.length > clampedLimit;
    const data = hasMore ? items.slice(0, clampedLimit) : items;
    const nextCursor = hasMore ? encodeOffsetCursor(offset + clampedLimit) : null;
    return { data, pagination: { limit: clampedLimit, nextCursor, hasMore } };
  },

  async quote(
    _: unknown,
    {
      amount,
      currency,
      feeMethod = 'USDC',
    }: { amount: string; currency: string; feeMethod?: string },
    ctx: GraphQLContext,
  ) {
    requireAuth(ctx);
    const { getQuote } = await import('../../services/quote.service');
    return getQuote({ amount, currency, feeMethod });
  },

  async currencies(_: unknown, __: unknown, ctx: GraphQLContext) {
    requireAuth(ctx);
    const { getCurrencies } = await import('../../currencies');
    return getCurrencies();
  },

  async institutions(_: unknown, { currency }: { currency: string }, ctx: GraphQLContext) {
    requireAuth(ctx);
    const { getInstitutions } = await import('../../currencies');
    return getInstitutions(currency);
  },

  async rate(_: unknown, { currency = 'NGN' }: { currency?: string }, ctx: GraphQLContext) {
    requireAuth(ctx);
    const { getRate } = await import('../../services/quote.service');
    const rate = await getRate(currency);
    return { rate, currency, updatedAt: new Date().toISOString() };
  },
};

// ─── Subscription Resolvers ───────────────────────────────────────────────────

export const transactionSubscriptions = {
  transactionStatusChanged: {
    subscribe: async function* (_: unknown, { id }: { id: string }) {
      while (true) {
        await new Promise((r) => setTimeout(r, 5000));
        const { getTransactionById } = await import('../../db/dal');
        const tx = await getTransactionById(id);
        if (tx) yield { transactionStatusChanged: tx };
      }
    },
  },

  rateUpdated: {
    subscribe: async function* (_: unknown, { currency = 'NGN' }: { currency?: string }) {
      while (true) {
        await new Promise((r) => setTimeout(r, 30000));
        const { getRate } = await import('../../services/quote.service');
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
        const { getTransactions } = await import('../../db/dal');
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
};
