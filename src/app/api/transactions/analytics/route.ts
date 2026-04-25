import { NextRequest, NextResponse } from 'next/server';
import { getTransactionAnalytics } from '@/lib/transaction-analytics';
import { ErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const periodDaysParam = request.nextUrl.searchParams.get('days');
  const parsedDays = periodDaysParam ? Number.parseInt(periodDaysParam, 10) : 7;
  const periodDays = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 7;

  try {
    const analytics = await getTransactionAnalytics(periodDays);
    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    return ErrorHandler.serverError(error);
  }
}
