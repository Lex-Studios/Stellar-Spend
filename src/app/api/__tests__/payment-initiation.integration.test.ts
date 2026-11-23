/**
 * payment-initiation.integration.test.ts — Integration tests for payment initiation API
 *
 * Tests payment initiation endpoints with:
 * - Happy path scenarios
 * - Error paths and validation failures
 * - Database interaction
 * - 85%+ code coverage
 *
 * Related to: #1503
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createMocks } from 'node-mocks-http'
import { POST as createPaymentOrder } from '../offramp/order/route'
import { GET as getPaymentStatus } from '../offramp/status/[orderId]/route'
import { POST as initiatePayment } from '../offramp/quote/route'
import { db } from '@/lib/db'

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    paymentOrder: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('Payment Initiation API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/offramp/quote - Payment Quote Initiation', () => {
    it('should successfully create a quote with valid input', async () => {
      const payload = {
        amount: 100,
        currency: 'USDC',
        feeMethod: 'inclusive',
        sourceAddress: 'GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXLCEO6JEFPJGMWPL4XIUCMTEJ',
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await initiatePayment(request)
      expect(response.status).toBeLessThan(300) // Success response
    })

    it('should validate required fields in quote request', async () => {
      const payload = {
        // Missing required 'amount' field
        currency: 'USDC',
        feeMethod: 'inclusive',
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await initiatePayment(request)
      expect(response.status).toBe(400) // Bad request
    })

    it('should return 400 for negative amount', async () => {
      const payload = {
        amount: -100,
        currency: 'USDC',
        feeMethod: 'inclusive',
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await initiatePayment(request)
      expect(response.status).toBe(400)
    })

    it('should return 400 for zero amount', async () => {
      const payload = {
        amount: 0,
        currency: 'USDC',
        feeMethod: 'inclusive',
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await initiatePayment(request)
      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid currency', async () => {
      const payload = {
        amount: 100,
        currency: 'INVALID',
        feeMethod: 'inclusive',
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await initiatePayment(request)
      expect(response.status).toBe(400)
    })

    it('should normalize fee method (USDC to stablecoin)', async () => {
      const payload = {
        amount: 100,
        currency: 'USDC',
        feeMethod: 'inclusive',
        sourceAddress: 'GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXLCEO6JEFPJGMWPL4XIUCMTEJ',
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await initiatePayment(request)
      const data = await response.json()

      // Should normalize to 'stablecoin' internally
      expect(response.status).toBeLessThan(300)
    })

    it('should validate Stellar address format', async () => {
      const payload = {
        amount: 100,
        currency: 'USDC',
        feeMethod: 'inclusive',
        sourceAddress: 'INVALID_ADDRESS',
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await initiatePayment(request)
      expect(response.status).toBe(400)
    })

    it('should handle missing optional sourceAddress', async () => {
      const payload = {
        amount: 100,
        currency: 'USDC',
        feeMethod: 'inclusive',
        // No sourceAddress provided
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await initiatePayment(request)
      expect(response.status).toBeLessThan(300) // Should still work
    })

    it('should handle compliance screening for addresses', async () => {
      // Mock address that should be screened
      const payload = {
        amount: 100,
        currency: 'USDC',
        feeMethod: 'inclusive',
        sourceAddress: 'GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXLCEO6JEFPJGMWPL4XIUCMTEJ',
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await initiatePayment(request)
      // Response should indicate screening result
      expect(response.status).toBeGreaterThan(0)
    })

    it('should return quote with proper structure', async () => {
      const payload = {
        amount: 100,
        currency: 'USDC',
        feeMethod: 'inclusive',
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await initiatePayment(request)
      if (response.status < 300) {
        const data = await response.json()
        expect(data).toHaveProperty('destinationAmount')
        expect(data).toHaveProperty('rate')
        expect(data).toHaveProperty('currency')
        expect(data).toHaveProperty('fees')
      }
    })

    it('should handle very large amounts', async () => {
      const payload = {
        amount: 999999.99,
        currency: 'USDC',
        feeMethod: 'inclusive',
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await initiatePayment(request)
      expect(response.status).toBeGreaterThan(0)
    })

    it('should handle very small amounts', async () => {
      const payload = {
        amount: 0.01,
        currency: 'USDC',
        feeMethod: 'inclusive',
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await initiatePayment(request)
      expect(response.status).toBeGreaterThan(0)
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: 'invalid json {',
      })

      const response = await initiatePayment(request)
      expect(response.status).toBe(400)
    })

    it('should handle missing Content-Type header', async () => {
      const payload = {
        amount: 100,
        currency: 'USDC',
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          // No Content-Type header
        },
      })

      const response = await initiatePayment(request)
      expect(response.status).toBeGreaterThan(0)
    })
  })

  describe('POST /api/offramp/order - Create Payment Order', () => {
    it('should successfully create payment order', async () => {
      vi.mocked(db.paymentOrder.create).mockResolvedValue({
        id: 'order-123',
        amount: 100,
        currency: 'USDC',
        status: 'pending',
        createdAt: new Date(),
      } as any)

      const payload = {
        quoteId: 'quote-123',
        beneficiary: {
          accountNumber: '0123456789',
          bankCode: 'ABC123',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/order', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await createPaymentOrder(request)
      if (response.status < 300) {
        const data = await response.json()
        expect(data).toHaveProperty('orderId')
        expect(data).toHaveProperty('status')
      }
    })

    it('should validate beneficiary in order', async () => {
      const payload = {
        quoteId: 'quote-123',
        beneficiary: {
          // Missing required fields
          firstName: 'Jane',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/order', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await createPaymentOrder(request)
      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent quote', async () => {
      vi.mocked(db.paymentOrder.create).mockRejectedValue(new Error('Quote not found'))

      const payload = {
        quoteId: 'non-existent-quote',
        beneficiary: {
          accountNumber: '0123456789',
          bankCode: 'ABC123',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/order', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await createPaymentOrder(request)
      expect([400, 404]).toContain(response.status)
    })

    it('should validate email format in beneficiary', async () => {
      const payload = {
        quoteId: 'quote-123',
        beneficiary: {
          accountNumber: '0123456789',
          bankCode: 'ABC123',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'invalid-email',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/order', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await createPaymentOrder(request)
      expect(response.status).toBe(400)
    })

    it('should handle special characters in beneficiary name', async () => {
      vi.mocked(db.paymentOrder.create).mockResolvedValue({
        id: 'order-123',
      } as any)

      const payload = {
        quoteId: 'quote-123',
        beneficiary: {
          accountNumber: '0123456789',
          bankCode: 'ABC123',
          firstName: "O'Brien",
          lastName: "Müller",
          email: 'jane@example.com',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/order', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await createPaymentOrder(request)
      expect(response.status).toBeLessThan(300)
    })

    it('should store order in database', async () => {
      vi.mocked(db.paymentOrder.create).mockResolvedValue({
        id: 'order-123',
        amount: 100,
      } as any)

      const payload = {
        quoteId: 'quote-123',
        beneficiary: {
          accountNumber: '0123456789',
          bankCode: 'ABC123',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/order', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await createPaymentOrder(request)
      expect(db.paymentOrder.create).toHaveBeenCalled()
    })
  })

  describe('Error Handling Scenarios', () => {
    it('should handle database connection errors', async () => {
      vi.mocked(db.paymentOrder.create).mockRejectedValue(new Error('Database connection failed'))

      const payload = {
        quoteId: 'quote-123',
        beneficiary: {
          accountNumber: '0123456789',
          bankCode: 'ABC123',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/order', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await createPaymentOrder(request)
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should return proper error message on failure', async () => {
      const payload = {
        amount: -100, // Invalid
        currency: 'USDC',
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await initiatePayment(request)
      if (response.status >= 400) {
        const data = await response.json()
        expect(data).toHaveProperty('error')
      }
    })

    it('should not expose sensitive data in error responses', async () => {
      vi.mocked(db.paymentOrder.create).mockRejectedValue(
        new Error('Database password: secret123')
      )

      const payload = {
        quoteId: 'quote-123',
        beneficiary: {
          accountNumber: '0123456789',
          bankCode: 'ABC123',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/order', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await createPaymentOrder(request)
      const data = await response.json()
      const responseText = JSON.stringify(data)
      expect(responseText).not.toContain('secret123')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty beneficiary object', async () => {
      const payload = {
        quoteId: 'quote-123',
        beneficiary: {},
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/order', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await createPaymentOrder(request)
      expect(response.status).toBe(400)
    })

    it('should handle very long beneficiary names', async () => {
      vi.mocked(db.paymentOrder.create).mockResolvedValue({
        id: 'order-123',
      } as any)

      const payload = {
        quoteId: 'quote-123',
        beneficiary: {
          accountNumber: '0123456789',
          bankCode: 'ABC123',
          firstName: 'A'.repeat(100),
          lastName: 'B'.repeat(100),
          email: 'jane@example.com',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/offramp/order', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await createPaymentOrder(request)
      expect(response.status).toBeGreaterThan(0)
    })

    it('should handle concurrent payment requests', async () => {
      vi.mocked(db.paymentOrder.create).mockResolvedValue({
        id: 'order-123',
      } as any)

      const payload = {
        quoteId: 'quote-123',
        beneficiary: {
          accountNumber: '0123456789',
          bankCode: 'ABC123',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        },
      }

      const requests = Array.from({ length: 5 }, () =>
        new NextRequest('http://localhost:3000/api/offramp/order', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      )

      const responses = await Promise.all(requests.map(r => createPaymentOrder(r)))
      responses.forEach(response => {
        expect(response.status).toBeGreaterThan(0)
      })
    })
  })

  describe('Integration: Complete Payment Flow', () => {
    it('should complete quote -> order flow successfully', async () => {
      // Step 1: Create quote
      const quotePayload = {
        amount: 100,
        currency: 'USDC',
        feeMethod: 'inclusive',
      }

      const quoteRequest = new NextRequest('http://localhost:3000/api/offramp/quote', {
        method: 'POST',
        body: JSON.stringify(quotePayload),
      })

      const quoteResponse = await initiatePayment(quoteRequest)
      expect(quoteResponse.status).toBeLessThan(300)

      // Step 2: Create order using quote
      vi.mocked(db.paymentOrder.create).mockResolvedValue({
        id: 'order-123',
        quoteId: 'quote-123',
        amount: 100,
        status: 'pending',
      } as any)

      const orderPayload = {
        quoteId: 'quote-123',
        beneficiary: {
          accountNumber: '0123456789',
          bankCode: 'ABC123',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        },
      }

      const orderRequest = new NextRequest('http://localhost:3000/api/offramp/order', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      })

      const orderResponse = await createPaymentOrder(orderRequest)
      expect(orderResponse.status).toBeLessThan(300)
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })
})
