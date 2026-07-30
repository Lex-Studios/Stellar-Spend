/**
 * Custom error classes for standardized error handling
 */

export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApplicationError";
    Object.setPrototypeOf(this, ApplicationError.prototype);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = "Unauthorized access") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = "Forbidden") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "CONFLICT", 409, details);
    this.name = "ConflictError";
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message: string = "Rate limit exceeded", retryAfter?: number) {
    super(message, "RATE_LIMIT", 429, retryAfter ? { retryAfter } : undefined);
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class TimeoutError extends ApplicationError {
  constructor(message: string = "Request timeout") {
    super(message, "TIMEOUT", 504);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class ExternalServiceError extends ApplicationError {
  constructor(
    service: string,
    message: string,
    public originalError?: Error,
  ) {
    super(`${service} error: ${message}`, "EXTERNAL_SERVICE_ERROR", 502);
    this.name = "ExternalServiceError";
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}
