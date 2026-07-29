import { NextRequest, NextResponse } from 'next/server';
import { vulnerabilityManager } from '@/lib/vulnerability-management';
import { logger } from '@/lib/logger';
import { ErrorHandler } from '@/lib/error-handler';
import { ApiError, ErrorType } from '@/lib/error-types';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = params;
    const success = vulnerabilityManager.resolveVulnerability(id);

    if (!success) {
      return ErrorHandler.notFound('Vulnerability');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to resolve vulnerability', { error });
    return ErrorHandler.handle(
      new ApiError(ErrorType.SERVER_ERROR, 'Failed to resolve vulnerability'),
    );
  }
}
