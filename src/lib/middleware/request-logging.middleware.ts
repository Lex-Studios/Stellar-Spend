import { NextRequest, NextResponse } from "next/server";
import { logger } from "../logger";

export interface RequestLogEntry {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp: string;
}

/**
 * Wraps an API route handler with structured request logging.
 *
 * - Generates a requestId (from incoming X-Request-Id header or self-generated)
 * - Emits a structured `http.request` log entry with correlation ID
 * - Propagates the requestId back to the caller via X-Request-Id response header
 */
export function requestLoggingMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId =
      req.headers.get("x-request-id") ??
      `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    const startTime = Date.now();
    const log = logger.withContext({ requestId });

    let response: NextResponse;
    try {
      response = await handler(req);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      log.error(
        "http.request",
        {
          method: req.method,
          path: req.nextUrl.pathname,
          status: 500,
          durationMs,
        },
        err,
      );
      throw err;
    }

    const durationMs = Date.now() - startTime;
    const status = response.status;

    const entry = {
      method: req.method,
      path: req.nextUrl.pathname,
      status,
      durationMs,
    };

    if (status >= 500) {
      log.error("http.request", entry);
    } else if (status >= 400) {
      log.warn("http.request", entry);
    } else {
      log.info("http.request", entry);
    }

    // Propagate correlation ID to caller
    const headers = new Headers(response.headers);
    headers.set("x-request-id", requestId);

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
