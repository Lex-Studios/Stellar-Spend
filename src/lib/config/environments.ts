import type { Config } from "./schema";

export const developmentConfig: Config = {
  environment: "development",
  api: {
    maxDuration: 20,
    timeoutMs: 30000,
    retryAttempts: 3,
    retryDelayMs: 1000,
  },
  fees: {
    stablecoinFee: "0.5",
    bridgeFeePercentage: 0.5,
    payoutFeePercentage: 0,
  },
  stellar: {
    mainnetPassphrase: "Public Global Stellar Network ; September 2015",
    minXlmBalance: 2,
    reserveAmount: 0.5,
  },
  bridge: {
    pollingIntervalMs: 2000,
    maxPollingAttempts: 150,
    timeoutMs: 300000,
  },
  payout: {
    pollingIntervalMs: 3000,
    maxPollingAttempts: 100,
    timeoutMs: 300000,
  },
  transaction: {
    estimatedTimeSeconds: 300,
    confirmationBlocks: 1,
  },
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  },
  cache: {
    currencyTtlMs: 3600000,
    rateTtlMs: 60000,
    institutionTtlMs: 86400000,
  },
  validation: {
    minAmount: "0.01",
    maxAmount: "1000000",
    amountDecimals: 2,
  },
};

export const stagingConfig: Config = {
  ...developmentConfig,
  environment: "staging",
  api: {
    ...developmentConfig.api,
    retryAttempts: 2,
  },
  rateLimit: {
    requestsPerMinute: 100,
    requestsPerHour: 2000,
  },
};

export const productionConfig: Config = {
  ...developmentConfig,
  environment: "production",
  api: {
    ...developmentConfig.api,
    retryAttempts: 1,
    retryDelayMs: 500,
  },
  rateLimit: {
    requestsPerMinute: 200,
    requestsPerHour: 5000,
  },
  cache: {
    ...developmentConfig.cache,
    currencyTtlMs: 7200000, // 2 hours
    institutionTtlMs: 172800000, // 48 hours
  },
};

export function getEnvironmentConfig(env?: string): Config {
  const environment = env || process.env.NODE_ENV || "development";

  switch (environment) {
    case "production":
      return productionConfig;
    case "staging":
      return stagingConfig;
    case "development":
    default:
      return developmentConfig;
  }
}
