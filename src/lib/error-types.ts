/**
 * Standard error response interface that all API routes should follow
 */
export interface StandardErrorResponse {
  /** Machine-readable error code or short message */
  error: string;
  /** Human-readable description (optional) */
  message?: string;
  /** Additional context (development only) */
  details?: unknown;
}

/**
 * Internal error context structure for processing
 */
export interface ErrorContext {
  originalError: unknown;
  statusCode: number;
  errorType: ErrorType;
  message?: string;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Environment configuration for error handling
 */
export interface EnvironmentConfig {
  isProduction: boolean;
  includeStackTrace: boolean;
  includeDetails: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Error classification for consistent handling
 */
export enum ErrorType {
  VALIDATION = 'validation_error',
  NOT_FOUND = 'not_found',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  SERVER_ERROR = 'server_error',
  EXTERNAL_SERVICE = 'external_service_error'
}

/**
 * HTTP status code mapping for error types
 */
export const ERROR_STATUS_CODES: Record<ErrorType, number> = {
  [ErrorType.VALIDATION]: 400,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.UNAUTHORIZED]: 401,
  [ErrorType.FORBIDDEN]: 403,
  [ErrorType.SERVER_ERROR]: 500,
  [ErrorType.EXTERNAL_SERVICE]: 502
};

/**
 * Utility function to get environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isProduction,
    includeStackTrace: !isProduction,
    includeDetails: !isProduction,
    logLevel: isProduction ? 'error' : 'debug'
  };
}

/**
 * Type guard to check if an object is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if an object has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}