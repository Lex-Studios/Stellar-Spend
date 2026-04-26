import { ClientError, withRetry, type ClientConfig, type RetryOptions } from './base';

export interface AllbridgeClientConfig extends ClientConfig {
  sorobanRpcUrl: string;
  horizonUrl: string;
}

export interface BridgeQuote {
  sourceToken: { symbol: string; decimals: number; chain: string };
  destinationToken: { symbol: string; decimals: number; chain: string };
  amount: string;
  fee: string;
}

export class AllbridgeClient {
  private sorobanRpcUrl: string;
  private horizonUrl: string;
  private timeout: number;
  private retryOptions: RetryOptions;

  constructor(config: AllbridgeClientConfig) {
    this.sorobanRpcUrl = config.sorobanRpcUrl;
    this.horizonUrl = config.horizonUrl;
    this.timeout = config.timeout || 15000;
    this.retryOptions = {
      maxRetries: config.retries || 3,
      delayMs: config.retryDelay || 1000,
      backoffMultiplier: 2,
    };
  }

  private async fetch(url: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
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

      return data;
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

  async getQuote(
    sourceChain: string,
    destinationChain: string,
    token: string,
    amount: string
  ): Promise<BridgeQuote> {
    return withRetry(
      () =>
        this.fetch(
          `${this.sorobanRpcUrl}/quote?sourceChain=${sourceChain}&destinationChain=${destinationChain}&token=${token}&amount=${amount}`
        ),
      this.retryOptions
    );
  }

  async getTransactionStatus(txHash: string): Promise<{ status: string; hash: string }> {
    return withRetry(
      () => this.fetch(`${this.horizonUrl}/transactions/${txHash}`),
      this.retryOptions
    );
  }

  async submitTransaction(xdr: string): Promise<{ hash: string; status: string }> {
    return withRetry(
      () =>
        this.fetch(`${this.horizonUrl}/transactions`, {
          method: 'POST',
          body: JSON.stringify({ tx: xdr }),
        }),
      this.retryOptions
    );
  }
}
