/**
 * Centralized configuration module for all application constants
 */

export { type Config, ConfigSchema, validateConfig } from "./schema";

export {
  developmentConfig,
  stagingConfig,
  productionConfig,
  getEnvironmentConfig,
} from "./environments";

export {
  ConfigManager,
  type ConfigVersion,
  getConfigManager,
  getConfig,
  getConfigSection,
} from "./manager";

// Legacy CONFIG export for backward compatibility
export const CONFIG = {
  // API Configuration
  API: {
    MAX_DURATION: 20,
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,
  },

  // Fee Configuration
  FEES: {
    STABLECOIN_FEE: "0.5",
    BRIDGE_FEE_PERCENTAGE: 0.5,
    PAYOUT_FEE_PERCENTAGE: 0,
  },

  // Stellar Configuration
  STELLAR: {
    MAINNET_PASSPHRASE: "Public Global Stellar Network ; September 2015",
    MIN_XLM_BALANCE: 2,
    RESERVE_AMOUNT: 0.5,
  },

  // Bridge Configuration
  BRIDGE: {
    POLLING_INTERVAL_MS: 2000,
    MAX_POLLING_ATTEMPTS: 150,
    TIMEOUT_MS: 300000,
  },

  // Payout Configuration
  PAYOUT: {
    POLLING_INTERVAL_MS: 3000,
    MAX_POLLING_ATTEMPTS: 100,
    TIMEOUT_MS: 300000,
  },

  // Transaction Configuration
  TRANSACTION: {
    ESTIMATED_TIME_SECONDS: 300,
    CONFIRMATION_BLOCKS: 1,
  },

  // Rate Limiting
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_HOUR: 1000,
  },

  // Cache Configuration
  CACHE: {
    CURRENCY_TTL_MS: 3600000, // 1 hour
    RATE_TTL_MS: 60000, // 1 minute
    INSTITUTION_TTL_MS: 86400000, // 24 hours
  },

  // Validation
  VALIDATION: {
    MIN_AMOUNT: "0.01",
    MAX_AMOUNT: "1000000",
    AMOUNT_DECIMALS: 2,
  },
} as const;

export type LegacyConfig = typeof CONFIG;
