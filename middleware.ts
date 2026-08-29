import { NextRequest, NextResponse } from 'next/server';
import { addSecurityHeaders } from './src/lib/security/headers';
import { authMiddleware } from './src/lib/middleware/auth';
import { geoMiddleware, attachGeoHeaders } from './src/lib/middleware/geo';
import { createLoggingMiddleware } from './src/lib/middleware/logging';
import { compressionMiddleware, addCompressionHeaders } from './src/lib/middleware/compression.middleware';
import { publicApiRateLimitMiddleware, addRateLimitHeaders } from './src/lib/middleware/public-api-rate-limit.middleware';

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

  // 1. Check rate limiting first (issue #967)
  const isAuthenticated = !!request.headers.get('x-account-id');
  const rateLimitResponse = publicApiRateLimitMiddleware(modifiedRequest, isAuthenticated);
  if (rateLimitResponse instanceof Promise) {
    // Handle async rate limiting (shouldn't be needed for sync version)
    response = NextResponse.next({ request: { headers: modifiedRequest.headers } });
  } else if (rateLimitResponse) {
    response = rateLimitResponse;
  } else {
    // 2. Check geo restrictions
    const geoResponse = geoMiddleware(modifiedRequest);
    if (geoResponse) {
      response = geoResponse;
    } else {
      // 3. Check auth/versioning
      const authResponse = authMiddleware(modifiedRequest);
      if (authResponse) {
        response = authResponse;
      } else {
        // 4. Pass through all other requests, forwarding the resolved
        // request ID so the route handler can correlate its own logs.
        response = NextResponse.next({ request: { headers: modifiedRequest.headers } });
      }
    }
  }

  // 5. Attach geo headers
  response = attachGeoHeaders(response, request);

  // 6. Add compression headers
  response = addCompressionHeaders(response, pathname);

  // 7. Add rate limit headers to response
  response = addRateLimitHeaders(response, modifiedRequest);

  // 8. Add security headers
  response = addSecurityHeaders(response);

  // 9. Log and add request ID
  const durationMs = Date.now() - start;
  response = loggingMiddleware(request, response, durationMs, requestId);

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
