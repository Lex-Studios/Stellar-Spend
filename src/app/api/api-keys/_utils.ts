import { NextRequest } from 'next/server';
import { ErrorHandler } from '@/lib/error-handler';
import { hasApiKeyAdminToken, isValidAdminToken } from '@/lib/api-keys';
import { extractRequestBearerToken } from '@/lib/auth/authorize';

export function requireApiKeyAdmin(request: NextRequest) {
  if (!hasApiKeyAdminToken()) {
    return ErrorHandler.serverError(new Error('API key admin token is not configured'));
  }

  const token = extractRequestBearerToken(request);

  if (!isValidAdminToken(token)) {
    return ErrorHandler.unauthorized('Invalid admin token');
  }

  return null;
}
