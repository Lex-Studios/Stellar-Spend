/**
 * Service Registry - Pre-configured services for the application
 */

import { DIContainer, ServiceLifetime } from "./container";
import {
  IQuoteService,
  IBridgeService,
  IPayoutService,
} from "@/lib/services/interfaces";
import { QuoteService } from "@/lib/services/quote.service";
import { BridgeService } from "@/lib/services/bridge.service";
import { PayoutService } from "@/lib/services/payout.service";
import { WalletManager } from "@/lib/wallets/manager";

export const SERVICE_KEYS = {
  QUOTE_SERVICE: "QuoteService",
  BRIDGE_SERVICE: "BridgeService",
  PAYOUT_SERVICE: "PayoutService",
  WALLET_MANAGER: "WalletManager",
} as const;

export interface ServiceConfig {
  key: string | symbol;
  lifetime: ServiceLifetime;
  factory: () => any;
}

/**
 * Configure the DI container with all application services
 */
export function configureServices(container: DIContainer): void {
  // Register services with appropriate lifetimes
  container.registerSingleton<IQuoteService>(
    SERVICE_KEYS.QUOTE_SERVICE,
    () => new QuoteService(),
  );

  container.registerSingleton<IBridgeService>(
    SERVICE_KEYS.BRIDGE_SERVICE,
    () => new BridgeService(),
  );

  container.registerSingleton<IPayoutService>(
    SERVICE_KEYS.PAYOUT_SERVICE,
    () => new PayoutService(),
  );

  container.registerSingleton<WalletManager>(
    SERVICE_KEYS.WALLET_MANAGER,
    () => new WalletManager(),
  );
}

/**
 * Get a service from the container
 */
export async function getService<T>(
  container: DIContainer,
  key: string,
  scopeId?: string,
): Promise<T> {
  return container.resolve<T>(key, scopeId);
}

/**
 * Get a service synchronously
 */
export function getServiceSync<T>(
  container: DIContainer,
  key: string,
  scopeId?: string,
): T {
  return container.resolveSync<T>(key, scopeId);
}

/**
 * Validate all services in the container
 */
export async function validateServices(container: DIContainer): Promise<void> {
  const result = await container.validate();
  if (!result.valid) {
    throw new Error(`DI validation failed:\n${result.errors.join("\n")}`);
  }
}
