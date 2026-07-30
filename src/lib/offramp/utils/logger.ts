/**
 * Structured request logging utility
 * Logs API requests with method, path, status, duration, and errors
 * Masks sensitive fields to prevent data leaks
 */

export interface RequestLog {
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode?: number;
  duration: number; // milliseconds
  error?: string;
  errorStack?: string;
}

// Sensitive field patterns to mask
const SENSITIVE_PATTERNS = [
  "api[_-]?key",
  "private[_-]?key",
  "secret",
  "password",
  "token",
  "authorization",
  "x-api-key",
];

/**
 * Generate a unique request ID for tracing
 * Simple UUID v4 implementation without external dependency
 */
export function generateRequestId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Mask sensitive values in an object
 */
function maskSensitiveData(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(maskSensitiveData);
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_PATTERNS.some((pattern) =>
      new RegExp(pattern, "i").test(key),
    );

    if (isSensitive) {
      masked[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * Log a structured API request
 */
export function logRequest(log: RequestLog): void {
  const logEntry = {
    ...log,
    timestamp: new Date(log.timestamp).toISOString(),
  };

  console.log(JSON.stringify(logEntry));
}

/**
 * Create a request logger middleware
 * Returns a function that logs request details
 */
export function createRequestLogger(
  requestId: string,
  method: string,
  path: string,
) {
  const startTime = Date.now();

  return {
    requestId,
    logSuccess: (statusCode: number) => {
      const duration = Date.now() - startTime;
      logRequest({
        requestId,
        timestamp: new Date().toISOString(),
        method,
        path,
        statusCode,
        duration,
      });
    },
    logError: (statusCode: number, error: Error | string) => {
      const duration = Date.now() - startTime;
      const errorMessage = typeof error === "string" ? error : error.message;
      const errorStack = error instanceof Error ? error.stack : undefined;

      logRequest({
        requestId,
        timestamp: new Date().toISOString(),
        method,
        path,
        statusCode,
        duration,
        error: errorMessage,
        errorStack,
      });
    },
  };
}

/**
 * Mask sensitive data in request/response bodies
 */
export function maskRequestBody(body: unknown): unknown {
  return maskSensitiveData(body);
}
