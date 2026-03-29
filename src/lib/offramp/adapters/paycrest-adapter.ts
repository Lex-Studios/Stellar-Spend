import type { 
  PayoutOrderRequest, 
  PayoutOrderResponse, 
  PayoutStatus 
} from '../types';
import { PayoutProviderAdapter } from './payout-provider';

const PAYCREST_STATUS_MAP: Record<string, PayoutStatus> = {
  'payment_order.pending':   'pending',
  'payment_order.validated': 'validated',
  'payment_order.settled':   'settled',
  'payment_order.refunded':  'refunded',
  'payment_order.expired':   'expired',
};

export function mapPaycrestStatus(webhookStatus: string): PayoutStatus {
  return PAYCREST_STATUS_MAP[webhookStatus] ?? 'pending';
}

export class PaycrestHttpError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'PaycrestHttpError';
    this.status = status;
    this.details = details;
    // Restore correct prototype chain for instanceof checks across transpilation boundaries
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PaycrestAdapter implements PayoutProviderAdapter {
  private apiUrl = 'https://api.paycrest.io/v1';

  constructor(private apiKey: string) {}

  /**
   * Private fetch method with authentication and timeout
   */
  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'API-Key': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        // Fallback for non-JSON responses
      }

      if (!response.ok) {
        throw new PaycrestHttpError(
          data?.message || response.statusText || 'Unknown error',
          response.status,
          data
        );
      }

      // Return data.data if it exists, otherwise return data
      return data?.data ?? data;
    } catch (error: any) {
      if (error instanceof PaycrestHttpError) {
        throw error;
      }
      
      if (error.name === 'AbortError') {
        throw new PaycrestHttpError('Request timeout', 504);
      }
      
      // Map network errors to 502
      throw new PaycrestHttpError(error.message || 'Network error', 502);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Implement createOrder(request: PayoutOrderRequest)
   */
  async createOrder(request: PayoutOrderRequest): Promise<PayoutOrderResponse> {
    return this.fetch('/sender/orders', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Implement getOrderStatus(orderId: string)
   */
  async getOrderStatus(orderId: string): Promise<{ status: PayoutStatus; id: string }> {
    const response = await this.fetch(`/sender/orders/${orderId}`, {
      method: 'GET',
    });
    
    // Map response status to PayoutStatus type
    return {
      status: response.status as PayoutStatus,
      id: response.id,
    };
  }

  // PayoutProviderAdapter requirements
  async getCurrencies(): Promise<Array<{ code: string; name: string; symbol: string }>> {
    return this.fetch('/sender/currencies');
  }

  async getInstitutions(currency: string): Promise<Array<{ code: string; name: string }>> {
    return this.fetch(`/sender/institutions/${currency}`);
  }

  async verifyAccount(institution: string, accountIdentifier: string): Promise<string> {
    try {
      const response = await this.fetch('/sender/verify-account', {
        method: 'POST',
        body: JSON.stringify({ institution, accountIdentifier }),
      });
      return response?.accountName || response?.data || '';
    } catch {
      return '';
    }
  }

  async getRate(
    token: string,
    amount: string,
    currency: string,
    options?: { network?: string; providerId?: string }
  ): Promise<number> {
    const queryParams = new URLSearchParams();
    if (options?.network) queryParams.set('network', options.network);
    if (options?.providerId) queryParams.set('provider_id', options.providerId);

    const qs = queryParams.toString();
    const response = await this.fetch(
      `/rates/${encodeURIComponent(token)}/${encodeURIComponent(amount)}/${encodeURIComponent(currency)}${qs ? `?${qs}` : ''}`
    );

    const rate = parseFloat(String(response?.data ?? response));
    if (!isFinite(rate)) throw new Error(`Invalid rate received: ${JSON.stringify(response)}`);
    return rate;
  }
}
