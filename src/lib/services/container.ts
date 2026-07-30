import { QuoteService } from "./quote.service";
import { BridgeService } from "./bridge.service";
import { PayoutService } from "./payout.service";
import { WebhookService } from "./webhook.service";
import { TransactionService } from "./transaction.service";

/**
 * Dependency Injection Container
 * Manages service instantiation and lifecycle
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, unknown> = new Map();

  private constructor() {
    this.registerDefaultServices();
  }

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  private registerDefaultServices(): void {
    this.register("quote", new QuoteService());
    this.register("bridge", new BridgeService());
    this.register("payout", new PayoutService());
    this.register("webhook", new WebhookService());
    this.register("transaction", new TransactionService());
  }

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service "${name}" not found in container`);
    }
    return service as T;
  }

  getQuoteService(): QuoteService {
    return this.get<QuoteService>("quote");
  }

  getBridgeService(): BridgeService {
    return this.get<BridgeService>("bridge");
  }

  getPayoutService(): PayoutService {
    return this.get<PayoutService>("payout");
  }

  getWebhookService(): WebhookService {
    return this.get<WebhookService>("webhook");
  }

  getTransactionService(): TransactionService {
    return this.get<TransactionService>("transaction");
  }

  reset(): void {
    this.services.clear();
    this.registerDefaultServices();
  }
}

export const container = ServiceContainer.getInstance();
