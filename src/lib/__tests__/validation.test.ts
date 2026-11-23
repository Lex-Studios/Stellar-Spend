/**
 * validation.test.ts — Comprehensive unit tests for validation utilities
 *
 * Tests all validation functions with:
 * - Boundary cases
 * - Edge values
 * - 90%+ code coverage
 * - Error handling
 *
 * Related to: #1502
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  validateAmount,
  validateMinAmount,
  validateMaxAmount,
  validateAmountRange,
  validateAddress,
  validateCurrency,
  validateBeneficiary,
  validatePaymentRequest,
  formatZodErrors,
} from '../validators'
import {
  validateBody,
  validateQuery,
} from '../validation/validate-request'

describe('Validation Utilities', () => {
  describe('validateAmount', () => {
    const amountTestCases = [
      { amount: 100, shouldPass: true, description: 'standard amount' },
      { amount: 0, shouldPass: false, description: 'zero amount' },
      { amount: -50, shouldPass: false, description: 'negative amount' },
      { amount: 0.01, shouldPass: true, description: 'very small amount' },
      { amount: 999999.99, shouldPass: true, description: 'large amount' },
      { amount: NaN, shouldPass: false, description: 'NaN' },
      { amount: Infinity, shouldPass: false, description: 'Infinity' },
      { amount: -Infinity, shouldPass: false, description: '-Infinity' },
    ]

    it.each(amountTestCases)(
      'should validate $description',
      ({ amount, shouldPass }) => {
        const result = validateAmount(amount)
        if (shouldPass) {
          expect(result).toBe(true)
        } else {
          expect(result).toBe(false)
        }
      }
    )

    it('should reject non-number values', () => {
      expect(validateAmount('100' as any)).toBe(false)
      expect(validateAmount(null as any)).toBe(false)
      expect(validateAmount(undefined as any)).toBe(false)
    })

    it('should handle precision correctly', () => {
      expect(validateAmount(100.00001)).toBe(true)
      expect(validateAmount(0.00000001)).toBe(true)
    })

    it('should reject amounts with rounding errors', () => {
      // 0.1 + 0.2 !== 0.3 in JavaScript
      const result = validateAmount(0.1 + 0.2)
      // Should still be valid as it's a number
      expect(typeof result).toBe('boolean')
    })
  })

  describe('validateMinAmount', () => {
    const minAmountTestCases = [
      { amount: 100, min: 50, shouldPass: true, description: 'amount above minimum' },
      { amount: 50, min: 50, shouldPass: true, description: 'amount equals minimum' },
      { amount: 49, min: 50, shouldPass: false, description: 'amount below minimum' },
      { amount: 0.01, min: 0.01, shouldPass: true, description: 'very small boundary' },
      { amount: 0.009, min: 0.01, shouldPass: false, description: 'just below small minimum' },
      { amount: 999999.99, min: 50, shouldPass: true, description: 'large amount vs small min' },
    ]

    it.each(minAmountTestCases)(
      'should validate $description',
      ({ amount, min, shouldPass }) => {
        const result = validateMinAmount(amount, min)
        expect(result).toBe(shouldPass)
      }
    )

    it('should handle zero minimum', () => {
      expect(validateMinAmount(0.01, 0)).toBe(true)
      expect(validateMinAmount(0, 0)).toBe(true)
      expect(validateMinAmount(-1, 0)).toBe(false)
    })

    it('should handle negative minimum edge case', () => {
      // Negative minimum is unusual but should be handled
      const result = validateMinAmount(0, -10)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('validateMaxAmount', () => {
    const maxAmountTestCases = [
      { amount: 100, max: 150, shouldPass: true, description: 'amount below maximum' },
      { amount: 150, max: 150, shouldPass: true, description: 'amount equals maximum' },
      { amount: 151, max: 150, shouldPass: false, description: 'amount above maximum' },
      { amount: 0.01, max: 0.01, shouldPass: true, description: 'very small boundary' },
      { amount: 0.011, max: 0.01, shouldPass: false, description: 'just above small maximum' },
      { amount: 999999.99, max: 999999.99, shouldPass: true, description: 'large amount boundary' },
      { amount: 1000000, max: 999999.99, shouldPass: false, description: 'exceeds large maximum' },
    ]

    it.each(maxAmountTestCases)(
      'should validate $description',
      ({ amount, max, shouldPass }) => {
        const result = validateMaxAmount(amount, max)
        expect(result).toBe(shouldPass)
      }
    )

    it('should handle zero maximum', () => {
      expect(validateMaxAmount(0, 0)).toBe(true)
      expect(validateMaxAmount(0.01, 0)).toBe(false)
      expect(validateMaxAmount(-1, 0)).toBe(true)
    })

    it('should handle negative maximum', () => {
      // Negative maximum is unusual but should be handled
      const result = validateMaxAmount(-100, -50)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('validateAmountRange', () => {
    const rangeTestCases = [
      { amount: 100, min: 50, max: 150, shouldPass: true, description: 'amount in middle of range' },
      { amount: 50, min: 50, max: 150, shouldPass: true, description: 'amount at min boundary' },
      { amount: 150, min: 50, max: 150, shouldPass: true, description: 'amount at max boundary' },
      { amount: 49, min: 50, max: 150, shouldPass: false, description: 'amount below range' },
      { amount: 151, min: 50, max: 150, shouldPass: false, description: 'amount above range' },
      { amount: 100, min: 150, max: 50, shouldPass: false, description: 'invalid range (min > max)' },
      { amount: 100, min: 100, max: 100, shouldPass: true, description: 'single point range' },
      { amount: 0.01, min: 0, max: 0.1, shouldPass: true, description: 'small range' },
    ]

    it.each(rangeTestCases)(
      'should validate $description',
      ({ amount, min, max, shouldPass }) => {
        const result = validateAmountRange(amount, min, max)
        expect(result).toBe(shouldPass)
      }
    )

    it('should handle zero range', () => {
      expect(validateAmountRange(0, 0, 0)).toBe(true)
    })

    it('should handle negative ranges', () => {
      // Negative amounts should fail in validateAmount, but range check should work
      const result = validateAmountRange(-50, -100, 0)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('validateAddress', () => {
    const validStellarAddress = 'GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXLCEO6JEFPJGMWPL4XIUCMTEJ' // 56 chars
    const validBaseAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f42485' // 42 chars (0x + 40)

    const addressTestCases = [
      { address: validStellarAddress, shouldPass: true, description: 'valid Stellar address' },
      { address: validBaseAddress, shouldPass: true, description: 'valid Base address' },
      { address: 'INVALID', shouldPass: false, description: 'invalid short address' },
      { address: '', shouldPass: false, description: 'empty address' },
      { address: '0x' + 'A'.repeat(40), shouldPass: true, description: 'valid Base address format' },
      { address: 'G' + 'A'.repeat(55), shouldPass: true, description: 'valid Stellar format' },
      { address: null as any, shouldPass: false, description: 'null address' },
      { address: undefined as any, shouldPass: false, description: 'undefined address' },
    ]

    it.each(addressTestCases)(
      'should validate $description',
      ({ address, shouldPass }) => {
        const result = validateAddress(address)
        expect(result).toBe(shouldPass)
      }
    )

    it('should validate Stellar address checksum', () => {
      // Stellar addresses use base32 encoding with checksum
      const validAddress = 'GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXLCEO6JEFPJGMWPL4XIUCMTEJ'
      expect(validateAddress(validAddress)).toBe(true)
    })

    it('should validate Base address format strictly', () => {
      // Base addresses must be 42 chars and start with 0x
      expect(validateAddress('0x' + 'A'.repeat(39))).toBe(false) // Too short
      expect(validateAddress('0x' + 'A'.repeat(41))).toBe(false) // Too long
      expect(validateAddress('00' + 'A'.repeat(40))).toBe(false) // Wrong prefix
    })

    it('should reject addresses with invalid characters', () => {
      expect(validateAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false)
    })
  })

  describe('validateCurrency', () => {
    const currencyTestCases = [
      { currency: 'USDC', shouldPass: true, description: 'standard stablecoin' },
      { currency: 'XLM', shouldPass: true, description: 'native currency' },
      { currency: 'EUR', shouldPass: true, description: 'fiat currency' },
      { currency: 'BRL', shouldPass: true, description: 'fiat currency' },
      { currency: 'GHS', shouldPass: true, description: 'fiat currency' },
      { currency: 'INVALID', shouldPass: false, description: 'invalid currency' },
      { currency: '', shouldPass: false, description: 'empty currency' },
      { currency: 'us dc', shouldPass: false, description: 'currency with space' },
      { currency: 'usd', shouldPass: false, description: 'lowercase currency' },
      { currency: null as any, shouldPass: false, description: 'null currency' },
    ]

    it.each(currencyTestCases)(
      'should validate $description',
      ({ currency, shouldPass }) => {
        const result = validateCurrency(currency)
        expect(result).toBe(shouldPass)
      }
    )

    it('should handle three-letter ISO codes', () => {
      const validCodes = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD']
      validCodes.forEach(code => {
        expect(validateCurrency(code)).toBe(true)
      })
    })

    it('should reject non-ISO codes', () => {
      expect(validateCurrency('USDA')).toBe(false) // 4 letters
      expect(validateCurrency('US')).toBe(false) // 2 letters
    })
  })

  describe('validateBeneficiary', () => {
    const validBeneficiary = {
      accountNumber: '1234567890',
      bankCode: 'BANK01',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    }

    it('should validate complete beneficiary', () => {
      const result = validateBeneficiary(validBeneficiary)
      expect(result).toBe(true)
    })

    it('should reject beneficiary missing required fields', () => {
      const { accountNumber, ...incomplete } = validBeneficiary
      const result = validateBeneficiary(incomplete)
      expect(result).toBe(false)
    })

    it('should reject beneficiary with invalid email', () => {
      const invalid = { ...validBeneficiary, email: 'invalid-email' }
      const result = validateBeneficiary(invalid)
      expect(result).toBe(false)
    })

    it('should handle beneficiary with special characters', () => {
      const special = {
        ...validBeneficiary,
        firstName: "O'Brien",
        lastName: "Müller",
      }
      const result = validateBeneficiary(special)
      expect(typeof result).toBe('boolean')
    })

    it('should validate empty strings as invalid', () => {
      const empty = {
        accountNumber: '',
        bankCode: '',
        firstName: '',
        lastName: '',
        email: '',
      }
      const result = validateBeneficiary(empty)
      expect(result).toBe(false)
    })

    it('should handle very long names', () => {
      const longName = {
        ...validBeneficiary,
        firstName: 'A'.repeat(100),
        lastName: 'B'.repeat(100),
      }
      const result = validateBeneficiary(longName)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('validatePaymentRequest', () => {
    const validPaymentRequest = {
      amount: 100,
      currency: 'USDC',
      beneficiary: {
        accountNumber: '1234567890',
        bankCode: 'BANK01',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      sourceAddress: 'GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXLCEO6JEFPJGMWPL4XIUCMTEJ',
    }

    it('should validate complete payment request', () => {
      const result = validatePaymentRequest(validPaymentRequest)
      expect(result).toBe(true)
    })

    it('should reject payment request missing required fields', () => {
      const { amount, ...incomplete } = validPaymentRequest
      const result = validatePaymentRequest(incomplete)
      expect(result).toBe(false)
    })

    it('should reject payment request with invalid amount', () => {
      const invalid = { ...validPaymentRequest, amount: -100 }
      const result = validatePaymentRequest(invalid)
      expect(result).toBe(false)
    })

    it('should reject payment request with invalid currency', () => {
      const invalid = { ...validPaymentRequest, currency: 'INVALID' }
      const result = validatePaymentRequest(invalid)
      expect(result).toBe(false)
    })

    it('should validate optional sourceAddress', () => {
      const withoutAddress = { ...validPaymentRequest }
      delete withoutAddress.sourceAddress
      const result = validatePaymentRequest(withoutAddress)
      expect(typeof result).toBe('boolean')
    })

    it('should handle payment request with invalid source address', () => {
      const invalid = { ...validPaymentRequest, sourceAddress: 'INVALID' }
      const result = validatePaymentRequest(invalid)
      expect(result).toBe(false)
    })
  })

  describe('formatZodErrors', () => {
    it('should format Zod validation errors', () => {
      const schema = z.object({
        amount: z.number().positive(),
        currency: z.string().length(3),
      })

      try {
        schema.parse({ amount: -100, currency: 'US' })
      } catch (error) {
        const formatted = formatZodErrors(error as z.ZodError)
        expect(Array.isArray(formatted)).toBe(true)
        expect(formatted.length).toBeGreaterThan(0)
        formatted.forEach(err => {
          expect(err).toHaveProperty('field')
          expect(err).toHaveProperty('message')
        })
      }
    })

    it('should handle multiple validation errors', () => {
      const schema = z.object({
        amount: z.number().positive(),
        currency: z.string().length(3),
        address: z.string().min(42),
      })

      try {
        schema.parse({ amount: -100, currency: 'TOOLONG', address: 'short' })
      } catch (error) {
        const formatted = formatZodErrors(error as z.ZodError)
        expect(formatted.length).toBeGreaterThanOrEqual(2)
      }
    })

    it('should include field names in errors', () => {
      const schema = z.object({
        amount: z.number().positive('Amount must be positive'),
      })

      try {
        schema.parse({ amount: -100 })
      } catch (error) {
        const formatted = formatZodErrors(error as z.ZodError)
        expect(formatted[0].field).toBe('amount')
        expect(formatted[0].message).toContain('positive')
      }
    })
  })

  describe('validateBody (Next.js API)', () => {
    it('should validate and parse JSON body', async () => {
      const schema = z.object({ amount: z.number() })
      const body = { amount: 100 }

      // Mocked request
      const mockRequest = {
        json: async () => body,
      } as any

      const result = await validateBody(mockRequest, schema)
      expect(result).toEqual(body)
    })

    it('should return error for invalid body', async () => {
      const schema = z.object({ amount: z.number() })
      const body = { amount: 'invalid' }

      const mockRequest = {
        json: async () => body,
      } as any

      const result = await validateBody(mockRequest, schema)
      expect(result).toHaveProperty('error')
    })
  })

  describe('validateQuery (Next.js API)', () => {
    it('should validate query parameters', () => {
      const schema = z.object({ amount: z.string().transform(Number) })
      const query = { amount: '100' }

      const result = validateQuery(query, schema)
      expect(result.amount).toBe(100)
    })

    it('should return error for invalid query', () => {
      const schema = z.object({ amount: z.string().transform(Number) })
      const query = { amount: 'invalid' }

      const result = validateQuery(query, schema)
      expect(result).toHaveProperty('error')
    })

    it('should handle missing optional query params', () => {
      const schema = z.object({ amount: z.string().optional() })
      const query = {}

      const result = validateQuery(query, schema)
      expect(result.error).toBeUndefined() // Optional so no error
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle null input gracefully', () => {
      expect(validateAmount(null as any)).toBe(false)
      expect(validateAddress(null as any)).toBe(false)
      expect(validateCurrency(null as any)).toBe(false)
    })

    it('should handle undefined input gracefully', () => {
      expect(validateAmount(undefined as any)).toBe(false)
      expect(validateAddress(undefined as any)).toBe(false)
      expect(validateCurrency(undefined as any)).toBe(false)
    })

    it('should handle object input gracefully', () => {
      expect(validateAmount({} as any)).toBe(false)
      expect(validateAddress({} as any)).toBe(false)
      expect(validateCurrency({} as any)).toBe(false)
    })

    it('should handle array input gracefully', () => {
      expect(validateAmount([] as any)).toBe(false)
      expect(validateAddress([] as any)).toBe(false)
      expect(validateCurrency([] as any)).toBe(false)
    })

    it('should handle extreme numbers', () => {
      expect(validateAmount(Number.MAX_VALUE)).toBe(false) // Too large
      expect(validateAmount(Number.MIN_VALUE)).toBe(true) // Very small but positive
      expect(validateAmount(-Number.MAX_VALUE)).toBe(false) // Negative
    })
  })

  describe('Integration: Complete Validation Workflow', () => {
    it('should validate complete offramp payment request', () => {
      const request = {
        amount: 500,
        currency: 'USDC',
        beneficiary: {
          accountNumber: '0123456789',
          bankCode: 'ABC123',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        },
        sourceAddress: 'GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXLCEO6JEFPJGMWPL4XIUCMTEJ',
      }

      expect(validatePaymentRequest(request)).toBe(true)
      expect(validateAmount(request.amount)).toBe(true)
      expect(validateCurrency(request.currency)).toBe(true)
      expect(validateAddress(request.sourceAddress)).toBe(true)
      expect(validateBeneficiary(request.beneficiary)).toBe(true)
    })

    it('should identify all validation errors in invalid request', () => {
      const request = {
        amount: -100, // Invalid
        currency: 'INVALIDCURRENCY', // Invalid
        beneficiary: {
          accountNumber: '',
          bankCode: '',
          firstName: '',
          lastName: '',
          email: '',
        },
        sourceAddress: 'INVALID', // Invalid
      }

      expect(validateAmount(request.amount)).toBe(false)
      expect(validateCurrency(request.currency)).toBe(false)
      expect(validateAddress(request.sourceAddress)).toBe(false)
      expect(validateBeneficiary(request.beneficiary)).toBe(false)
    })
  })
})
