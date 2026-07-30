import { NextRequest, NextResponse } from "next/server";
import { ApplicationError, isApplicationError } from "./custom-errors";
import { ErrorLogger } from "./error-logger";

export interface ErrorMiddlewareOptions {
  includeStackTrace?: boolean;
  logErrors?: boolean;
}

export function createErrorMiddleware(options: ErrorMiddlewareOptions = {}) {
  const { includeStackTrace = false, logErrors = true } = options;

  return async (
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>,
  ): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      const context = {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent") || undefined,
        requestId: request.headers.get("x-request-id") || undefined,
      };

      if (logErrors) {
        ErrorLogger.log(error, context);
      }

      return formatErrorResponse(error, includeStackTrace);
    }
  };
}

export function formatErrorResponse(
  error: unknown,
  includeStackTrace: boolean = false,
): NextResponse {
  if (isApplicationError(error)) {
    const response: Record<string, unknown> = {
      error: error.code,
      message: error.message,
    };

    if (error.details) {
      response.details = error.details;
    }

    if (includeStackTrace && error.stack) {
      response.stack = error.stack;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  if (error instanceof Error) {
    const response: Record<string, unknown> = {
      error: "INTERNAL_SERVER_ERROR",
      message: includeStackTrace ? error.message : "Internal server error",
    };

    if (includeStackTrace) {
      response.stack = error.stack;
    }

    return NextResponse.json(response, { status: 500 });
  }

  return NextResponse.json(
    {
      error: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
    { status: 500 },
  );
}

/**
 * Wrapper for API route handlers to apply error handling
 */
export function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: ErrorMiddlewareOptions = {},
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const middleware = createErrorMiddleware(options);
    return middleware(req, handler);
  };
}
