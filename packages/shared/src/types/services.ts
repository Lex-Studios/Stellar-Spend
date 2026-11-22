/**
 * Shared service-layer types (issue #1540)
 *
 * Types used by both the front-end service layer (src/lib/services/) and
 * any other package that invokes the quote or payout services. Placing them
 * here gives a single source of truth and eliminates the copies that
 * previously lived in src/lib/services/quote.service.ts.
 */

/**
 * Request shape for the internal QuoteService.
 * Note: this differs from the REST QuoteRequest in api-responses.ts — the
 * REST type uses a TokenInfo pair while this service-layer type uses a
 * feeMethod string because the service selects the token automatically.
 */
export interface ServiceQuoteRequest {
  amount: string;
  currency: string;
  feeMethod: 'USDC' | 'XLM' | 'stablecoin' | 'native';
}

/**
 * Response shape from the internal QuoteService.
 */
export interface ServiceQuoteResponse {
  destinationAmount: string;
  rate: number;
  currency: string;
  bridgeFee: string;
  payoutFee: string;
  estimatedTime: number;
}
