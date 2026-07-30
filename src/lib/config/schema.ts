import { z } from "zod";

/**
 * Configuration schema for validation
 */

const EnvironmentSchema = z.enum(["development", "staging", "production"]);

const ApiConfigSchema = z.object({
  maxDuration: z.number().positive().default(20),
  timeoutMs: z.number().positive().default(30000),
  retryAttempts: z.number().nonnegative().default(3),
  retryDelayMs: z.number().positive().default(1000),
});

const FeeConfigSchema = z.object({
  stablecoinFee: z.string().default("0.5"),
  bridgeFeePercentage: z.number().nonnegative().default(0.5),
  payoutFeePercentage: z.number().nonnegative().default(0),
});

const StellarConfigSchema = z.object({
  mainnetPassphrase: z
    .string()
    .default("Public Global Stellar Network ; September 2015"),
  minXlmBalance: z.number().positive().default(2),
  reserveAmount: z.number().positive().default(0.5),
});

const BridgeConfigSchema = z.object({
  pollingIntervalMs: z.number().positive().default(2000),
  maxPollingAttempts: z.number().positive().default(150),
  timeoutMs: z.number().positive().default(300000),
});

const PayoutConfigSchema = z.object({
  pollingIntervalMs: z.number().positive().default(3000),
  maxPollingAttempts: z.number().positive().default(100),
  timeoutMs: z.number().positive().default(300000),
});

const TransactionConfigSchema = z.object({
  estimatedTimeSeconds: z.number().positive().default(300),
  confirmationBlocks: z.number().positive().default(1),
});

const RateLimitConfigSchema = z.object({
  requestsPerMinute: z.number().positive().default(60),
  requestsPerHour: z.number().positive().default(1000),
});

const CacheConfigSchema = z.object({
  currencyTtlMs: z.number().positive().default(3600000),
  rateTtlMs: z.number().positive().default(60000),
  institutionTtlMs: z.number().positive().default(86400000),
});

const ValidationConfigSchema = z.object({
  minAmount: z.string().default("0.01"),
  maxAmount: z.string().default("1000000"),
  amountDecimals: z.number().nonnegative().default(2),
});

export const ConfigSchema = z.object({
  environment: EnvironmentSchema.default("development"),
  api: ApiConfigSchema.default({}),
  fees: FeeConfigSchema.default({}),
  stellar: StellarConfigSchema.default({}),
  bridge: BridgeConfigSchema.default({}),
  payout: PayoutConfigSchema.default({}),
  transaction: TransactionConfigSchema.default({}),
  rateLimit: RateLimitConfigSchema.default({}),
  cache: CacheConfigSchema.default({}),
  validation: ValidationConfigSchema.default({}),
});

export type Config = z.infer<typeof ConfigSchema>;

export function validateConfig(config: unknown): Config {
  return ConfigSchema.parse(config);
}
