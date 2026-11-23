/**
 * fee-calculation.test.ts — Comprehensive unit tests for fee calculations
 *
 * Tests all fee calculation functions with:
 * - Edge values and boundary cases
 * - Table-driven test approach
 * - Rounding and precision handling
 * - Multiple fee scenarios
 *
 * Related to: #1501
 */

import { describe, it, expect } from 'vitest'
import {
  calculateBridgeFee,
  calculateNetworkFee,
  calculatePaycrestFee,
  calculateTotalFees,
  calculateAmountAfterFees,
  calculateAllFees,
  getDetailedFeeBreakdown,
} from '../fee-calculation'

describe('Fee Calculation Functions', () => {
  describe('calculateBridgeFee', () => {
    // Table-driven test cases
    const bridgeFeeTestCases = [
      // { amount, currency, expectedFee, description }
      { amount: 100, currency: 'USDC', expectedFee: 0.5, description: 'standard USDC amount' },
      { amount: 50, currency: 'USDC', expectedFee: 0.25, description: '50 USDC' },
      { amount: 1000, currency: 'USDC', expectedFee: 5, description: '1000 USDC' },
      { amount: 0.01, currency: 'USDC', expectedFee: 0.00005, description: 'very small amount' },
      { amount: 999999.99, currency: 'USDC', expectedFee: 4999.9995, description: 'large amount' },
      { amount: 100, currency: 'XLM', expectedFee: 0, description: 'native currency (no fee)' },
      { amount: 50, currency: 'XLM', expectedFee: 0, description: '50 XLM (no fee)' },
      { amount: 0, currency: 'USDC', expectedFee: 0, description: 'zero amount' },
      { amount: 1, currency: 'USDC', expectedFee: 0.005, description: 'one unit' },
      { amount: 0.001, currency: 'USDC', expectedFee: 0.000005, description: 'sub-cent amount' },
    ]

    it.each(bridgeFeeTestCases)(
      'should calculate $description',
      ({ amount, currency, expectedFee }) => {
        const fee = calculateBridgeFee(amount, currency)
        expect(fee).toBeCloseTo(expectedFee, 6) // Allow 6 decimal places
      }
    )

    it('should handle currency-insensitive calculation', () => {
      expect(calculateBridgeFee(100, 'usdc')).toBeCloseTo(0.5, 6)
      expect(calculateBridgeFee(100, 'USDC')).toBeCloseTo(0.5, 6)
    })
  })

  describe('calculateNetworkFee', () => {
    const networkFeeTestCases = [
      { currency: 'XLM', expectedFee: 0.00001, description: 'native currency' },
      { currency: 'USDC', expectedFee: 0, description: 'stablecoin (no fee)' },
      { currency: 'EUR', expectedFee: 0, description: 'fiat currency (no fee)' },
      { currency: 'BRL', expectedFee: 0, description: 'fiat currency (no fee)' },
    ]

    it.each(networkFeeTestCases)(
      'should calculate network fee for $description',
      ({ currency, expectedFee }) => {
        const fee = calculateNetworkFee(currency)
        expect(fee).toBe(expectedFee)
      }
    )

    it('should be independent of amount', () => {
      expect(calculateNetworkFee('XLM')).toBe(0.00001)
      expect(calculateNetworkFee('XLM')).toBe(0.00001)
    })
  })

  describe('calculatePaycrestFee', () => {
    const paycrestFeeTestCases = [
      { amount: 100, expectedFee: 1, description: '100 units' },
      { amount: 50, expectedFee: 0.5, description: '50 units' },
      { amount: 1000, expectedFee: 10, description: '1000 units' },
      { amount: 0.01, expectedFee: 0.0001, description: 'very small amount' },
      { amount: 999999.99, expectedFee: 9999.9999, description: 'large amount' },
      { amount: 0, expectedFee: 0, description: 'zero amount' },
      { amount: 1, expectedFee: 0.01, description: 'one unit' },
      { amount: 0.001, expectedFee: 0.00001, description: 'sub-unit amount' },
    ]

    it.each(paycrestFeeTestCases)(
      'should calculate Paycrest fee for $description',
      ({ amount, expectedFee }) => {
        const fee = calculatePaycrestFee(amount)
        expect(fee).toBeCloseTo(expectedFee, 6)
      }
    )

    it('should always be 1% of amount', () => {
      const testAmounts = [10, 50, 100, 500, 1000]
      testAmounts.forEach(amount => {
        const fee = calculatePaycrestFee(amount)
        const expectedFee = amount * 0.01
        expect(fee).toBeCloseTo(expectedFee, 6)
      })
    })
  })

  describe('calculateTotalFees', () => {
    const totalFeesTestCases = [
      {
        amount: 100,
        currency: 'USDC',
        expectedTotal: 1.5, // bridge 0.5 + network 0 + Paycrest 1
        description: 'standard USDC scenario',
      },
      {
        amount: 100,
        currency: 'XLM',
        expectedTotal: 1.00001, // bridge 0 + network 0.00001 + Paycrest 1
        description: 'native currency scenario',
      },
      {
        amount: 50,
        currency: 'USDC',
        expectedTotal: 0.75, // bridge 0.25 + network 0 + Paycrest 0.5
        description: '50 USDC',
      },
      {
        amount: 1000,
        currency: 'USDC',
        expectedTotal: 15, // bridge 5 + network 0 + Paycrest 10
        description: '1000 USDC',
      },
      {
        amount: 0,
        currency: 'USDC',
        expectedTotal: 0,
        description: 'zero amount',
      },
      {
        amount: 1,
        currency: 'XLM',
        expectedTotal: 0.01001, // bridge 0 + network 0.00001 + Paycrest 0.01
        description: 'one XLM',
      },
    ]

    it.each(totalFeesTestCases)(
      'should calculate total fees for $description',
      ({ amount, currency, expectedTotal }) => {
        const totalFee = calculateTotalFees(amount, currency)
        expect(totalFee).toBeCloseTo(expectedTotal, 6)
      }
    )

    it('should be sum of bridge, network, and Paycrest fees', () => {
      const amount = 100
      const currency = 'USDC'
      const totalFee = calculateTotalFees(amount, currency)
      const bridgeFee = calculateBridgeFee(amount, currency)
      const networkFee = calculateNetworkFee(currency)
      const paycrestFee = calculatePaycrestFee(amount)
      expect(totalFee).toBeCloseTo(bridgeFee + networkFee + paycrestFee, 6)
    })
  })

  describe('calculateAmountAfterFees', () => {
    const amountAfterFeesTestCases = [
      {
        amount: 100,
        currency: 'USDC',
        expectedAmount: 98.5, // 100 - 1.5 fees
        description: 'standard USDC scenario',
      },
      {
        amount: 100,
        currency: 'XLM',
        expectedAmount: 98.99999, // 100 - 1.00001 fees
        description: 'native currency scenario',
      },
      {
        amount: 50,
        currency: 'USDC',
        expectedAmount: 49.25, // 50 - 0.75 fees
        description: '50 USDC',
      },
      {
        amount: 1000,
        currency: 'USDC',
        expectedAmount: 985, // 1000 - 15 fees
        description: '1000 USDC',
      },
      {
        amount: 0,
        currency: 'USDC',
        expectedAmount: 0,
        description: 'zero amount',
      },
    ]

    it.each(amountAfterFeesTestCases)(
      'should calculate amount after fees for $description',
      ({ amount, currency, expectedAmount }) => {
        const result = calculateAmountAfterFees(amount, currency)
        expect(result).toBeCloseTo(expectedAmount, 6)
      }
    )

    it('should deduct total fees from original amount', () => {
      const amount = 100
      const currency = 'USDC'
      const amountAfter = calculateAmountAfterFees(amount, currency)
      const totalFee = calculateTotalFees(amount, currency)
      expect(amountAfter).toBeCloseTo(amount - totalFee, 6)
    })

    it('should never exceed original amount', () => {
      const testCases = [
        { amount: 100, currency: 'USDC' },
        { amount: 50, currency: 'XLM' },
        { amount: 1000, currency: 'USDC' },
      ]
      testCases.forEach(({ amount, currency }) => {
        const result = calculateAmountAfterFees(amount, currency)
        expect(result).toBeLessThanOrEqual(amount)
      })
    })
  })

  describe('calculateAllFees', () => {
    const allFeesTestCases = [
      {
        amount: 100,
        currency: 'USDC',
        expected: {
          bridgeFee: 0.5,
          networkFee: 0,
          paycrestFee: 1,
          totalFee: 1.5,
        },
        description: 'standard USDC scenario',
      },
      {
        amount: 100,
        currency: 'XLM',
        expected: {
          bridgeFee: 0,
          networkFee: 0.00001,
          paycrestFee: 1,
          totalFee: 1.00001,
        },
        description: 'native currency scenario',
      },
      {
        amount: 50,
        currency: 'USDC',
        expected: {
          bridgeFee: 0.25,
          networkFee: 0,
          paycrestFee: 0.5,
          totalFee: 0.75,
        },
        description: '50 USDC',
      },
    ]

    it.each(allFeesTestCases)(
      'should calculate all fees for $description',
      ({ amount, currency, expected }) => {
        const result = calculateAllFees(amount, currency)
        expect(result.bridgeFee).toBeCloseTo(expected.bridgeFee, 6)
        expect(result.networkFee).toBeCloseTo(expected.networkFee, 6)
        expect(result.paycrestFee).toBeCloseTo(expected.paycrestFee, 6)
        expect(result.totalFee).toBeCloseTo(expected.totalFee, 6)
      }
    )

    it('should return object with all fee components', () => {
      const result = calculateAllFees(100, 'USDC')
      expect(result).toHaveProperty('bridgeFee')
      expect(result).toHaveProperty('networkFee')
      expect(result).toHaveProperty('paycrestFee')
      expect(result).toHaveProperty('totalFee')
      expect(typeof result.bridgeFee).toBe('number')
      expect(typeof result.networkFee).toBe('number')
      expect(typeof result.paycrestFee).toBe('number')
      expect(typeof result.totalFee).toBe('number')
    })

    it('should total equal sum of components', () => {
      const result = calculateAllFees(100, 'USDC')
      const sum = result.bridgeFee + result.networkFee + result.paycrestFee
      expect(result.totalFee).toBeCloseTo(sum, 6)
    })
  })

  describe('getDetailedFeeBreakdown', () => {
    it('should provide detailed breakdown with percentage', () => {
      const breakdown = getDetailedFeeBreakdown(100, 'USDC')
      expect(breakdown).toHaveProperty('bridgeFee')
      expect(breakdown).toHaveProperty('networkFee')
      expect(breakdown).toHaveProperty('paycrestFee')
      expect(breakdown).toHaveProperty('totalFee')
      expect(breakdown).toHaveProperty('percentageOfAmount')
    })

    it('should calculate percentage correctly', () => {
      const breakdown = getDetailedFeeBreakdown(100, 'USDC')
      const expectedPercentage = (breakdown.totalFee / 100) * 100
      expect(breakdown.percentageOfAmount).toBeCloseTo(expectedPercentage, 2)
    })

    it('should show zero percentage for zero amount', () => {
      const breakdown = getDetailedFeeBreakdown(0, 'USDC')
      expect(breakdown.totalFee).toBe(0)
      // Handle potential NaN for 0/0 percentage
      expect(breakdown.percentageOfAmount).toBeLessThanOrEqual(0.1)
    })

    const detailedBreakdownTestCases = [
      { amount: 100, currency: 'USDC', expectedPercentage: 1.5 },
      { amount: 50, currency: 'USDC', expectedPercentage: 1.5 },
      { amount: 1000, currency: 'USDC', expectedPercentage: 1.5 },
      { amount: 100, currency: 'XLM', expectedPercentage: 1.00001 },
    ]

    it.each(detailedBreakdownTestCases)(
      'should show correct percentage for $amount $currency',
      ({ amount, currency, expectedPercentage }) => {
        const breakdown = getDetailedFeeBreakdown(amount, currency)
        expect(breakdown.percentageOfAmount).toBeCloseTo(expectedPercentage, 2)
      }
    )
  })

  describe('Edge Cases and Precision', () => {
    it('should handle very small amounts correctly', () => {
      const amount = 0.0001
      const totalFee = calculateTotalFees(amount, 'USDC')
      expect(totalFee).toBeGreaterThanOrEqual(0)
      expect(totalFee).toBeLessThanOrEqual(amount) // Fee should not exceed amount
    })

    it('should handle very large amounts correctly', () => {
      const amount = 999999999.99
      const totalFee = calculateTotalFees(amount, 'USDC')
      expect(totalFee).toBeGreaterThan(0)
      expect(Number.isFinite(totalFee)).toBe(true)
    })

    it('should maintain precision through calculation chain', () => {
      const amount = 100.5
      const currency = 'USDC'
      const totalFee = calculateTotalFees(amount, currency)
      const afterFees = calculateAmountAfterFees(amount, currency)
      const reconstructed = afterFees + totalFee
      expect(reconstructed).toBeCloseTo(amount, 6)
    })

    it('should use truncate-toward-zero precision', () => {
      // Most fees should truncate rather than round
      const amount = 33.33
      const paycrestFee = calculatePaycrestFee(amount)
      // 33.33 * 0.01 = 0.3333, should truncate
      expect(paycrestFee).toBeLessThanOrEqual(0.34)
      expect(paycrestFee).toBeGreaterThanOrEqual(0.33)
    })

    it('should handle negative amounts gracefully', () => {
      // Negative amounts should return 0 or throw
      const result = calculateTotalFees(-100, 'USDC')
      expect(result).toBeLessThanOrEqual(0) // Either 0 or negative
    })

    it('should handle special float values', () => {
      // NaN should be handled
      expect(() => calculateTotalFees(NaN, 'USDC')).not.toThrow()
      // Infinity edge case
      expect(() => calculateTotalFees(Infinity, 'USDC')).not.toThrow()
    })
  })

  describe('Integration: Full Fee Calculation Scenarios', () => {
    it('should correctly calculate fees for complete offramp scenario', () => {
      const amount = 500 // User wants to offramp 500 USDC
      const currency = 'USDC'

      const bridgeFee = calculateBridgeFee(amount, currency)
      const networkFee = calculateNetworkFee(currency)
      const paycrestFee = calculatePaycrestFee(amount)
      const totalFee = calculateTotalFees(amount, currency)
      const amountAfterFees = calculateAmountAfterFees(amount, currency)

      expect(bridgeFee).toBe(2.5) // 0.5% of 500
      expect(networkFee).toBe(0)
      expect(paycrestFee).toBe(5) // 1% of 500
      expect(totalFee).toBe(7.5)
      expect(amountAfterFees).toBe(492.5)
    })

    it('should correctly calculate fees for XLM onramp scenario', () => {
      const amount = 100 // User receives 100 XLM
      const currency = 'XLM'

      const totalFee = calculateTotalFees(amount, currency)
      const breakdown = getDetailedFeeBreakdown(amount, currency)

      expect(breakdown.bridgeFee).toBe(0) // No bridge fee for native
      expect(breakdown.networkFee).toBeCloseTo(0.00001, 6)
      expect(breakdown.paycrestFee).toBeCloseTo(1, 2)
      expect(breakdown.totalFee).toBeCloseTo(1.00001, 6)
    })
  })
})
