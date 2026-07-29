import { NextRequest, NextResponse } from 'next/server';
import { connectionPoolManager } from '@/lib/db/connection-pool';
import { logger } from '@/lib/logger';
import { ErrorHandler } from '@/lib/error-handler';
import { ApiError, ErrorType } from '@/lib/error-types';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const stats = connectionPoolManager.getAllPoolStats();
    return NextResponse.json({ poolStats: stats });
  } catch (error) {
    logger.error('Failed to fetch connection pool stats', { error });
    return ErrorHandler.handle(
      new ApiError(ErrorType.SERVER_ERROR, 'Failed to fetch connection pool stats'),
    );
  }
}
