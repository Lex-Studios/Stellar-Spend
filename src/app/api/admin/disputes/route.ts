import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { disputeRepository } from '@/lib/repositories';
import { DisputeStatus, DisputeUpdate } from '@shared/types/disputes';
import { ErrorHandler } from '@/lib/error-handler';
import { ApiError, ErrorType } from '@/lib/error-types';
import { decodeCursor, createPaginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const status = req.nextUrl.searchParams.get('status');
    const cursor = req.nextUrl.searchParams.get('cursor');
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 1000);

    const offset = decodeCursor(cursor);
    const disputes = await disputeRepository.listDisputes(
      (status || undefined) as DisputeStatus | undefined,
      limit + 1,
      offset,
    );

    const hasMore = disputes.length > limit;
    const data = hasMore ? disputes.slice(0, limit) : disputes;

    return NextResponse.json(
      createPaginatedResponse(data, offset, limit, offset + disputes.length),
    );
  } catch (error) {
    logger.error('Error fetching disputes', {}, error);
    return ErrorHandler.handle(new ApiError(ErrorType.SERVER_ERROR, 'Failed to fetch disputes'));
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const { disputeId, update }: { disputeId: string; update: DisputeUpdate } = await req.json();

    if (!disputeId) {
      return ErrorHandler.validation('Dispute ID required');
    }

    const dispute = await disputeRepository.updateDispute(disputeId, update);

    if (!dispute) {
      return ErrorHandler.notFound('Dispute');
    }

    return NextResponse.json(dispute);
  } catch (error) {
    logger.error('Error updating dispute', {}, error);
    return ErrorHandler.handle(new ApiError(ErrorType.SERVER_ERROR, 'Failed to update dispute'));
  }
}
