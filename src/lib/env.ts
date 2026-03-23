/**
 * Centralized environment configuration module
 *
 * IMPORTANT: Never import server-side variables in client components!
 * Server-side vars are only available during SSR/API routes.
 * Client-side vars must be prefixed with NEXT_PUBLIC_
 *
 * Usage Examples:
 *
 * ✅ In API routes (server-side):
 * import { PAYCREST_API_KEY, BASE_PRIVATE_KEY } from '@/lib/env';
 *
 * ✅ In client components (browser):
 * import { NEXT_PUBLIC_BASE_RETURN_ADDRESS } from '@/lib/env';
 *
 * ❌ Never do this in client components:
 * import { PAYCREST_API_KEY } from '@/lib/env'; // Will cause build errors!
 */

// Server-side environment variables (SSR/API routes only)
function getRequiredServerEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required server environment variable: ${key}. ` +
        `Please check your .env file and ensure ${key} is set.`
    );
  }
  return value;
}

function getOptionalServerEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

// Client-side environment variables (available in browser)
function getRequiredPublicEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required public environment variable: ${key}. ` +
        `Please check your .env file and ensure ${key} is set with NEXT_PUBLIC_ prefix.`
    );
  }
  return value;
}

// Server-side only constants
// ⚠️ DO NOT IMPORT THESE IN CLIENT COMPONENTS ⚠️
export const PAYCREST_API_KEY = getRequiredServerEnv('PAYCREST_API_KEY');
export const PAYCREST_WEBHOOK_SECRET = getRequiredServerEnv('PAYCREST_WEBHOOK_SECRET');
export const BASE_PRIVATE_KEY = getRequiredServerEnv('BASE_PRIVATE_KEY');
export const BASE_RETURN_ADDRESS = getRequiredServerEnv('BASE_RETURN_ADDRESS');
export const BASE_RPC_URL = getRequiredServerEnv('BASE_RPC_URL');
export const STELLAR_SOROBAN_RPC_URL = getRequiredServerEnv('STELLAR_SOROBAN_RPC_URL');
export const STELLAR_HORIZON_URL = getRequiredServerEnv('STELLAR_HORIZON_URL');

// Public constants (safe for client-side use)
export const NEXT_PUBLIC_BASE_RETURN_ADDRESS = getRequiredPublicEnv(
  'NEXT_PUBLIC_BASE_RETURN_ADDRESS'
);
export const NEXT_PUBLIC_STELLAR_USDC_ISSUER = getRequiredPublicEnv(
  'NEXT_PUBLIC_STELLAR_USDC_ISSUER'
);

// Environment validation - runs at module load time
if (typeof window === 'undefined') {
  // Server-side validation
  console.log('✅ Server environment variables validated successfully');
} else {
  // Client-side validation for public vars only
  console.log('✅ Public environment variables validated successfully');
}

/*
 * ESLint Rule Suggestion:
 * To enforce proper usage, add this rule to your ESLint config:
 *
 * {
 *   "rules": {
 *     "no-restricted-imports": [
 *       "error",
 *       {
 *         "patterns": [
 *           {
 *             "group": ["** /env"],
 *             "importNames": [
 *               "PAYCREST_API_KEY",
 *               "PAYCREST_WEBHOOK_SECRET",
 *               "BASE_PRIVATE_KEY",
 *               "BASE_RETURN_ADDRESS",
 *               "BASE_RPC_URL",
 *               "STELLAR_SOROBAN_RPC_URL",
 *               "STELLAR_HORIZON_URL"
 *             ],
 *             "message": "Server-side environment variables cannot be imported in client components. Use NEXT_PUBLIC_ prefixed variables instead."
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 */
