/**
 * Service Container for Dependency Injection
 */

import { IQuoteService, IBridgeService, IPayoutService, IWalletService } from './interfaces';
import { QuoteService } from './quote.service';
import { BridgeService } from './bridge.service';
import { PayoutService } from './payout.service';

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

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
    this.register<IQuoteService>('QuoteService', new QuoteService());
    this.register<IBridgeService>('BridgeService', new BridgeService());
    this.register<IPayoutService>('PayoutService', new PayoutService());
  }

  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found in container`);
    }
    return service as T;
  }

  getQuoteService(): IQuoteService {
    return this.get<IQuoteService>('QuoteService');
  }

  getBridgeService(): IBridgeService {
    return this.get<IBridgeService>('BridgeService');
  }

  getPayoutService(): IPayoutService {
    return this.get<IPayoutService>('PayoutService');
  }
}

export const serviceContainer = ServiceContainer.getInstance();
