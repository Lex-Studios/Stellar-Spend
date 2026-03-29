import { NextResponse } from 'next/server';
import { ErrorHandler } from './error-handler';
import { StandardErrorResponse } from './error-types';

/**
 * Migration helper utilities for gradually adopting the standardized error format
 */
export class ErrorMigrationHelpers {
  /**
   * Wrap an existing API route handler to catch and standardize errors
   */
  static wrapHandler<T = any>(
    handler: (request: Request, context?: any) => Promise<NextResponse<T>>
  ) {
    return async (request: Request, context?: any): Promise<NextResponse<T | StandardErrorResponse>> => {
      try {
        return await handler(request, context);
      } catch (error) {
        return ErrorHandler.handle(error);
      }
    };
  }

  /**
   * Convert legacy error responses to the new standard format
   */
  static convertLegacyError(
    legacyError: any,
    statusCode?: number
  ): NextResponse<StandardErrorResponse> {
    // Handle common legacy error formats
    if (legacyError?.error && typeof legacyError.error === 'string') {
      return ErrorHandler.handle(new Error(legacyError.error), statusCode);
    }

    if (legacyError?.message && typeof legacyError.message === 'string') {
      return ErrorHandler.handle(new Error(legacyError.message), statusCode);
    }

    if (typeof legacyError === 'string') {
      return ErrorHandler.handle(new Error(legacyError), statusCode);
    }

    return ErrorHandler.handle(legacyError, statusCode);
  }

  /**
   * Helper for common validation error scenarios
   */
  static validationError(field: string, value: any, requirement: string): NextResponse<StandardErrorResponse> {
    const message = `Invalid ${field}: ${requirement}`;
    return ErrorHandler.validation(message, field);
  }

  /**
   * Helper for external service errors
   */
  static externalServiceError(
    serviceName: string,
    originalError: unknown
  ): NextResponse<StandardErrorResponse> {
    const message = `External service error: ${serviceName}`;
    return ErrorHandler.handle(new Error(message), 502);
  }

  /**
   * Helper for rate limiting errors
   */
  static rateLimitError(retryAfter?: number): NextResponse<StandardErrorResponse> {
    const response = ErrorHandler.handle(new Error('Rate limit exceeded'), 429);
    
    if (retryAfter) {
      response.headers.set('Retry-After', retryAfter.toString());
    }
    
    return response;
  }

  /**
   * Helper for timeout errors
   */
  static timeoutError(operation: string): NextResponse<StandardErrorResponse> {
    const message = `Operation timeout: ${operation}`;
    return ErrorHandler.handle(new Error(message), 408);
  }

  /**
   * Migration example: Before and after patterns
   */
  static examples = {
    /**
     * BEFORE: Legacy error handling
     * 
     * try {
     *   // API logic
     * } catch (error) {
     *   return NextResponse.json({ message: error.message }, { status: 500 });
     * }
     */

    /**
     * AFTER: Standardized error handling
     * 
     * try {
     *   // API logic
     * } catch (error) {
     *   return ErrorHandler.handle(error);
     * }
     */

    /**
     * VALIDATION BEFORE:
     * 
     * if (!email) {
     *   return NextResponse.json({ error: 'Email is required' }, { status: 400 });
     * }
     */

    /**
     * VALIDATION AFTER:
     * 
     * if (!email) {
     *   return ErrorHandler.validation('Email is required', 'email');
     * }
     */

    /**
     * NOT FOUND BEFORE:
     * 
     * if (!user) {
     *   return NextResponse.json({ message: 'User not found' }, { status: 404 });
     * }
     */

    /**
     * NOT FOUND AFTER:
     * 
     * if (!user) {
     *   return ErrorHandler.notFound('User');
     * }
     */
  };
}

/**
 * Decorator for automatic error handling (experimental)
 */
export function withErrorHandling<T extends any[], R>(
  target: (...args: T) => Promise<NextResponse<R>>
) {
  return async (...args: T): Promise<NextResponse<R | StandardErrorResponse>> => {
    try {
      return await target(...args);
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  };
}

/**
 * Type-safe error response checker
 */
export function isStandardErrorResponse(
  response: any
): response is StandardErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.error === 'string' &&
    response.error.length > 0 &&
    (response.message === undefined || typeof response.message === 'string') &&
    (response.details === undefined || response.details !== null)
  );
}