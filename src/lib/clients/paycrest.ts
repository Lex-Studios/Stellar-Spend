import { ClientError, withRetry, type ClientConfig, type RetryOptions } from './base';

export interface PaycrestClientConfig extends ClientConfig {
  apiKey: string;
  apiUrl?: string;
}

export interface PayoutOrderRequest {
  amount: string;
  currency: string;
  institution: string;
  accountIdentifier: string;
  accountName?: string;
}

export interface PayoutOrderResponse {
  id: string;
  status: string;
  amount: string;
  currency: string;
}

export class PaycrestClient {
  private apiUrl: string;
  private apiKey: string;
  private timeout: number;
  private retryOptions: RetryOptions;

  constructor(config: PaycrestClientConfig) {
    this.apiUrl = config.apiUrl || 'https://api.paycrest.io/v1';
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 15000;
    this.retryOptions = {
      maxRetries: config.retries || 3,
      delayMs: config.retryDelay || 1000,
      backoffMultiplier: 2,
    };
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

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
        throw new ClientError(
          data?.message || response.statusText || 'Unknown error',
          response.status,
          data
        );
      }

      return data?.data ?? data;
    } catch (error: any) {
      if (error instanceof ClientError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new ClientError('Request timeout', 504);
      }

      throw new ClientError(error.message || 'Network error', 502);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async createOrder(request: PayoutOrderRequest): Promise<PayoutOrderResponse> {
    return withRetry(
      () =>
        this.fetch('/sender/orders', {
          method: 'POST',
          body: JSON.stringify(request),
        }),
      this.retryOptions
    );
  }

  async getOrderStatus(orderId: string): Promise<{ status: string; id: string }> {
    return withRetry(
      () =>
        this.fetch(`/sender/orders/${orderId}`, {
          method: 'GET',
        }),
      this.retryOptions
    );
  }

  async getCurrencies(): Promise<Array<{ code: string; name: string; symbol: string }>> {
    return withRetry(() => this.fetch('/sender/currencies'), this.retryOptions);
  }

  async getInstitutions(currency: string): Promise<Array<{ code: string; name: string }>> {
    return withRetry(
      () => this.fetch(`/sender/institutions/${currency}`),
      this.retryOptions
    );
  }

  async verifyAccount(institution: string, accountIdentifier: string): Promise<string> {
    try {
      const response = await withRetry(
        () =>
          this.fetch('/sender/verify-account', {
            method: 'POST',
            body: JSON.stringify({ institution, accountIdentifier }),
          }),
        this.retryOptions
      );
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
    const response = await withRetry(
      () =>
        this.fetch(
          `/rates/${encodeURIComponent(token)}/${encodeURIComponent(amount)}/${encodeURIComponent(currency)}${qs ? `?${qs}` : ''}`
        ),
      this.retryOptions
    );

    const rate = parseFloat(String(response?.data ?? response));
    if (!isFinite(rate)) throw new Error(`Invalid rate received: ${JSON.stringify(response)}`);
    return rate;
  }
}
