import { logger } from "../logger";
import { ApplicationError, isApplicationError } from "./custom-errors";

export interface ErrorLogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: unknown;
}

export class ErrorLogger {
  static log(error: unknown, context?: ErrorLogContext): void {
    const logContext = {
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (isApplicationError(error)) {
      logger.error({
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        ...logContext,
      });
    } else if (error instanceof Error) {
      logger.error({
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...logContext,
      });
    } else {
      logger.error({
        message: "Unknown error",
        error: String(error),
        ...logContext,
      });
    }
  }

  static logValidation(
    field: string,
    message: string,
    context?: ErrorLogContext,
  ): void {
    this.log(new Error(`Validation error on ${field}: ${message}`), context);
  }

  static logUnauthorized(reason: string, context?: ErrorLogContext): void {
    this.log(new Error(`Unauthorized: ${reason}`), context);
  }

  static logExternalService(
    service: string,
    error: unknown,
    context?: ErrorLogContext,
  ): void {
    const message = error instanceof Error ? error.message : String(error);
    this.log(
      new Error(`External service error from ${service}: ${message}`),
      context,
    );
  }
}
