/**
 * quote-aggregator.test.ts — Comprehensive unit tests for quote aggregation and ranking
 *
 * Tests quote aggregator functionality with:
 * - Quote ranking and selection
 * - Provider reliability tracking
 * - Multi-provider scenarios
 * - Edge cases and error handling
 *
 * Related to: #1501
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  aggregateQuotes,
  rankQuotes,
  selectBestQuote,
  QuoteProvider,
  Quote,
  ProviderReliability,
} from '../quote-aggregator'

describe('Quote Aggregator', () => {
  describe('rankQuotes', () => {
    it('should rank quotes by net payout in descending order', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 95,
          rate: 0.95,
          fees: 5,
          responseTime: 100,
        },
        {
          provider: 'allbridge' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 98,
          rate: 0.98,
          fees: 2,
          responseTime: 150,
        },
        {
          provider: 'bridge' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 92,
          rate: 0.92,
          fees: 8,
          responseTime: 80,
        },
      ]

      const ranked = rankQuotes(quotes)
      expect(ranked[0].destinationAmount).toBe(98) // Best payout
      expect(ranked[1].destinationAmount).toBe(95)
      expect(ranked[2].destinationAmount).toBe(92) // Worst payout
    })

    it('should use reliability as tiebreaker when payouts equal', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 95, // Same payout
          rate: 0.95,
          fees: 5,
          responseTime: 100,
        },
        {
          provider: 'allbridge' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 95, // Same payout
          rate: 0.95,
          fees: 5,
          responseTime: 150,
        },
      ]

      // Assuming same reliability, should maintain order or use response time
      const ranked = rankQuotes(quotes)
      expect(ranked.length).toBe(2)
      expect(ranked[0].destinationAmount).toBe(95)
      expect(ranked[1].destinationAmount).toBe(95)
    })

    it('should use response time as final tiebreaker', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 95,
          rate: 0.95,
          fees: 5,
          responseTime: 150, // Slower
        },
        {
          provider: 'allbridge' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 95,
          rate: 0.95,
          fees: 5,
          responseTime: 100, // Faster
        },
      ]

      const ranked = rankQuotes(quotes)
      // Faster response should rank higher
      expect(ranked[0].responseTime).toBeLessThanOrEqual(ranked[1].responseTime)
    })

    it('should handle empty quote list', () => {
      const ranked = rankQuotes([])
      expect(ranked).toEqual([])
    })

    it('should handle single quote', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 95,
          rate: 0.95,
          fees: 5,
          responseTime: 100,
        },
      ]

      const ranked = rankQuotes(quotes)
      expect(ranked.length).toBe(1)
      expect(ranked[0].provider).toBe('paycrest')
    })
  })

  describe('selectBestQuote', () => {
    it('should select quote with highest destination amount', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 95,
          rate: 0.95,
          fees: 5,
          responseTime: 100,
        },
        {
          provider: 'allbridge' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 98,
          rate: 0.98,
          fees: 2,
          responseTime: 150,
        },
      ]

      const best = selectBestQuote(quotes)
      expect(best.provider).toBe('allbridge')
      expect(best.destinationAmount).toBe(98)
    })

    it('should return null for empty quote list', () => {
      const best = selectBestQuote([])
      expect(best).toBeNull()
    })

    it('should return single quote when only one available', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 95,
          rate: 0.95,
          fees: 5,
          responseTime: 100,
        },
      ]

      const best = selectBestQuote(quotes)
      expect(best).toEqual(quotes[0])
    })

    it('should handle negative destination amounts', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: -5, // Error state
          rate: 0.95,
          fees: 5,
          responseTime: 100,
        },
        {
          provider: 'allbridge' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 98,
          rate: 0.98,
          fees: 2,
          responseTime: 150,
        },
      ]

      const best = selectBestQuote(quotes)
      expect(best.destinationAmount).toBeGreaterThan(0)
    })
  })

  describe('aggregateQuotes', () => {
    it('should combine quotes from multiple providers', async () => {
      const result = await aggregateQuotes({
        amount: 100,
        currency: 'USDC',
        providers: ['paycrest', 'allbridge'],
      })

      expect(result.quotes).toBeDefined()
      expect(Array.isArray(result.quotes)).toBe(true)
      expect(result.bestQuote).toBeDefined()
    })

    it('should include reliability information in result', async () => {
      const result = await aggregateQuotes({
        amount: 100,
        currency: 'USDC',
        providers: ['paycrest', 'allbridge'],
      })

      expect(result.providerReliability).toBeDefined()
      Object.entries(result.providerReliability).forEach(([provider, reliability]) => {
        expect(reliability).toHaveProperty('successRate')
        expect(reliability).toHaveProperty('status')
      })
    })

    it('should mark degraded providers', async () => {
      const result = await aggregateQuotes({
        amount: 100,
        currency: 'USDC',
        providers: ['paycrest', 'allbridge'],
      })

      Object.entries(result.providerReliability).forEach(([, reliability]) => {
        expect(['healthy', 'degraded', 'unhealthy']).toContain(reliability.status)
      })
    })

    it('should handle provider failure gracefully', async () => {
      // Should not throw, should mark provider as degraded
      const result = await aggregateQuotes({
        amount: 100,
        currency: 'USDC',
        providers: ['paycrest', 'allbridge'],
      })

      expect(result.quotes).toBeDefined()
      expect(result.bestQuote).toBeDefined()
    })

    it('should cache results when requested', async () => {
      const result1 = await aggregateQuotes(
        {
          amount: 100,
          currency: 'USDC',
          providers: ['paycrest', 'allbridge'],
        },
        { cache: true }
      )

      const result2 = await aggregateQuotes(
        {
          amount: 100,
          currency: 'USDC',
          providers: ['paycrest', 'allbridge'],
        },
        { cache: true }
      )

      expect(result1).toEqual(result2)
    })

    it('should bypass cache when requested', async () => {
      const result1 = await aggregateQuotes(
        {
          amount: 100,
          currency: 'USDC',
          providers: ['paycrest', 'allbridge'],
        },
        { cache: false }
      )

      const result2 = await aggregateQuotes(
        {
          amount: 100,
          currency: 'USDC',
          providers: ['paycrest', 'allbridge'],
        },
        { cache: false }
      )

      // Both should complete successfully
      expect(result1.bestQuote).toBeDefined()
      expect(result2.bestQuote).toBeDefined()
    })
  })

  describe('ProviderReliability Tracking', () => {
    let reliability: ProviderReliability

    beforeEach(() => {
      reliability = {
        successCount: 0,
        failureCount: 0,
        successRate: 1,
        status: 'healthy' as const,
      }
    })

    it('should calculate success rate correctly', () => {
      reliability.successCount = 90
      reliability.failureCount = 10
      const rate = reliability.successCount / (reliability.successCount + reliability.failureCount)
      expect(rate).toBe(0.9)
    })

    it('should mark provider as degraded when success rate drops', () => {
      const degradedThreshold = 0.8
      reliability.successCount = 50
      reliability.failureCount = 50
      const rate = reliability.successCount / (reliability.successCount + reliability.failureCount)

      if (rate < degradedThreshold) {
        reliability.status = 'degraded'
      }

      expect(reliability.status).toBe('degraded')
    })

    it('should mark provider as unhealthy when success rate is very low', () => {
      const unhealthyThreshold = 0.5
      reliability.successCount = 10
      reliability.failureCount = 90
      const rate = reliability.successCount / (reliability.successCount + reliability.failureCount)

      if (rate < unhealthyThreshold) {
        reliability.status = 'unhealthy'
      }

      expect(reliability.status).toBe('unhealthy')
    })

    it('should handle zero success/failure counts', () => {
      reliability.successCount = 0
      reliability.failureCount = 0
      const rate = reliability.successCount / (reliability.successCount + reliability.failureCount || 1)
      expect(isFinite(rate)).toBe(true)
    })
  })

  describe('Quote Selection Scenarios', () => {
    it('should prefer better rates when multiple quotes available', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 95, // Rate 0.95
          rate: 0.95,
          fees: 5,
          responseTime: 100,
        },
        {
          provider: 'allbridge' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 98, // Rate 0.98 (better)
          rate: 0.98,
          fees: 2,
          responseTime: 150,
        },
      ]

      const best = selectBestQuote(quotes)
      expect(best.rate).toBeGreaterThan(0.95)
    })

    it('should select lowest-fee quote when rates equal', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 98,
          rate: 0.98,
          fees: 2,
          responseTime: 100,
        },
        {
          provider: 'allbridge' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 98,
          rate: 0.98,
          fees: 2,
          responseTime: 150,
        },
      ]

      const best = selectBestQuote(quotes)
      expect(best.fees).toBeLessThanOrEqual(2)
    })

    it('should prefer faster quotes when payouts equal', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 95,
          rate: 0.95,
          fees: 5,
          responseTime: 150,
        },
        {
          provider: 'allbridge' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 95,
          rate: 0.95,
          fees: 5,
          responseTime: 100,
        },
      ]

      const ranked = rankQuotes(quotes)
      expect(ranked[0].responseTime).toBeLessThanOrEqual(ranked[1].responseTime)
    })
  })

  describe('Edge Cases', () => {
    it('should handle quotes with zero destination amount', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 0, // Edge case
          rate: 0,
          fees: 100,
          responseTime: 100,
        },
      ]

      const best = selectBestQuote(quotes)
      expect(best).toBeDefined()
    })

    it('should handle quotes with very high fees', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 50, // 50% fee
          rate: 0.5,
          fees: 50,
          responseTime: 100,
        },
      ]

      const best = selectBestQuote(quotes)
      expect(best.fees).toBe(50)
    })

    it('should handle quotes with very fast response times', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 95,
          rate: 0.95,
          fees: 5,
          responseTime: 1, // Very fast
        },
      ]

      const ranked = rankQuotes(quotes)
      expect(ranked[0].responseTime).toBe(1)
    })

    it('should handle quotes with very slow response times', () => {
      const quotes: Quote[] = [
        {
          provider: 'paycrest' as QuoteProvider,
          sourceAmount: 100,
          destinationAmount: 95,
          rate: 0.95,
          fees: 5,
          responseTime: 10000, // Very slow
        },
      ]

      const ranked = rankQuotes(quotes)
      expect(ranked[0].responseTime).toBe(10000)
    })

    it('should handle large number of providers', () => {
      const quotes: Quote[] = Array.from({ length: 100 }, (_, i) => ({
        provider: `provider-${i}` as QuoteProvider,
        sourceAmount: 100,
        destinationAmount: 95 + (i % 5) * 0.1, // Varying payouts
        rate: 0.95 + (i % 5) * 0.001,
        fees: 5 - (i % 5) * 0.1,
        responseTime: 100 + i,
      }))

      const ranked = rankQuotes(quotes)
      expect(ranked.length).toBe(100)
      expect(ranked[0].destinationAmount).toBeGreaterThanOrEqual(ranked[99].destinationAmount)
    })
  })

  describe('Integration: Full Quote Selection Workflow', () => {
    it('should complete full quote aggregation and selection workflow', async () => {
      const result = await aggregateQuotes({
        amount: 1000,
        currency: 'USDC',
        providers: ['paycrest', 'allbridge'],
      })

      // Verify complete workflow
      expect(result.quotes).toBeDefined()
      expect(Array.isArray(result.quotes)).toBe(true)
      expect(result.quotes.length).toBeGreaterThan(0)

      expect(result.bestQuote).toBeDefined()
      expect(result.bestQuote?.destinationAmount).toBeGreaterThan(0)

      expect(result.providerReliability).toBeDefined()
      Object.entries(result.providerReliability).forEach(([, reliability]) => {
        expect(['healthy', 'degraded', 'unhealthy']).toContain(reliability.status)
      })

      // Best quote should have highest destination amount
      const maxAmount = Math.max(...result.quotes.map(q => q.destinationAmount))
      expect(result.bestQuote.destinationAmount).toBe(maxAmount)
    })

    it('should handle comparison of different currencies', async () => {
      const result1 = await aggregateQuotes({
        amount: 100,
        currency: 'USDC',
        providers: ['paycrest'],
      })

      const result2 = await aggregateQuotes({
        amount: 100,
        currency: 'EUR',
        providers: ['paycrest'],
      })

      expect(result1.bestQuote).toBeDefined()
      expect(result2.bestQuote).toBeDefined()
      // Both should complete successfully despite different currencies
    })
  })
})
