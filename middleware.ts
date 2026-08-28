import { NextRequest, NextResponse } from 'next/server';
import { addSecurityHeaders } from './src/lib/security/headers';
import { authMiddleware } from './src/lib/middleware/auth';
import { geoMiddleware, attachGeoHeaders } from './src/lib/middleware/geo';
import { createLoggingMiddleware } from './src/lib/middleware/logging';
import { compressionMiddleware, addCompressionHeaders } from './src/lib/middleware/compression.middleware';

export function middleware(request: NextRequest): NextResponse {
  const start = Date.now();
  const loggingMiddleware = createLoggingMiddleware();
  const pathname = new URL(request.url).pathname;

  // Resolve the correlation ID once, up front, so the value logged here is
  // the exact same value route handlers see via request.headers.get('x-request-id').
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // 0. Apply compression middleware to request
  let modifiedRequest = request;
  const compressionReq = compressionMiddleware(request);
  if (compressionReq) {
    modifiedRequest = compressionReq;
    modifiedRequest.headers.set('x-request-id', requestId);
  }

  let response: NextResponse;

  // 1. Check geo restrictions first
  const geoResponse = geoMiddleware(modifiedRequest);
  if (geoResponse) {
    response = geoResponse;
  } else {
    // 2. Check auth/versioning
    const authResponse = authMiddleware(modifiedRequest);
    if (authResponse) {
      response = authResponse;
    } else {
      // 3. Pass through all other requests, forwarding the resolved
      // request ID so the route handler can correlate its own logs.
      response = NextResponse.next({ request: { headers: modifiedRequest.headers } });
    }
  }

  // 4. Attach geo headers
  response = attachGeoHeaders(response, request);

  // 5. Add compression headers
  response = addCompressionHeaders(response, pathname);

  // 6. Add security headers
  response = addSecurityHeaders(response);

  // 7. Log and add request ID
  const durationMs = Date.now() - start;
  response = loggingMiddleware(request, response, durationMs, requestId);

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
