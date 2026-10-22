import { loadEnvConfig, type ValidatedEnv } from './config/schema';

/**
 * Thin accessor over the schema-validated loader in `config/schema.ts`.
 * Validation rules live there; this module only binds them to process.env.
 */
export function validateEnv(): ValidatedEnv {
  return loadEnvConfig(process.env);
}

export const env = process.env.VITEST ? ({} as ValidatedEnv) : validateEnv();
