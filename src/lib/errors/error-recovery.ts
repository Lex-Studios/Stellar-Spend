import {
  ApplicationError,
  TimeoutError,
  ExternalServiceError,
} from "./custom-errors";

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
};

export class ErrorRecovery {
  /**
   * Retry a function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error | undefined;
    let delay = finalConfig.delayMs;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on validation or authorization errors
        if (
          error instanceof ApplicationError &&
          (error.statusCode === 400 ||
            error.statusCode === 401 ||
            error.statusCode === 403)
        ) {
          throw error;
        }

        if (attempt < finalConfig.maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(
            delay * finalConfig.backoffMultiplier,
            finalConfig.maxDelayMs,
          );
        }
      }
    }

    throw lastError || new Error("Max retry attempts exceeded");
  }

  /**
   * Fallback to a default value on error
   */
  static async withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  }

  /**
   * Circuit breaker pattern for external service calls
   */
  static createCircuitBreaker<T>(
    fn: () => Promise<T>,
    options: {
      failureThreshold: number;
      resetTimeoutMs: number;
    } = { failureThreshold: 5, resetTimeoutMs: 60000 },
  ) {
    let failureCount = 0;
    let lastFailureTime: number | null = null;
    let state: "closed" | "open" | "half-open" = "closed";

    return async (): Promise<T> => {
      // Check if circuit should reset
      if (state === "open" && lastFailureTime) {
        if (Date.now() - lastFailureTime > options.resetTimeoutMs) {
          state = "half-open";
          failureCount = 0;
        } else {
          throw new Error("Circuit breaker is open");
        }
      }

      try {
        const result = await fn();
        if (state === "half-open") {
          state = "closed";
          failureCount = 0;
        }
        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = Date.now();

        if (failureCount >= options.failureThreshold) {
          state = "open";
        }

        throw error;
      }
    };
  }

  /**
   * Timeout wrapper for promises
   */
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new TimeoutError(`Operation timed out after ${timeoutMs}ms`),
            ),
          timeoutMs,
        ),
      ),
    ]);
  }

  /**
   * Determine if an error is retryable
   */
  static isRetryable(error: unknown): boolean {
    if (error instanceof TimeoutError) return true;
    if (error instanceof ExternalServiceError) return true;

    if (error instanceof ApplicationError) {
      // Retry on 5xx errors and specific 4xx errors
      return error.statusCode >= 500 || error.statusCode === 429;
    }

    return true; // Retry unknown errors by default
  }
}
