import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../logger';

export interface RequestLogEntry {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: string;
}

export function requestLoggingMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const response = await handler(req);
    const duration = Date.now() - startTime;

    const logEntry: RequestLogEntry = {
      requestId,
      method: req.method,
      path: req.nextUrl.pathname,
      statusCode: response.status,
      duration,
      timestamp: new Date().toISOString(),
    };

    if (response.status >= 400) {
      logger.warn('Request completed with error', logEntry);
    } else {
      logger.info('Request completed', logEntry);
    }

    return response;
  };
}
