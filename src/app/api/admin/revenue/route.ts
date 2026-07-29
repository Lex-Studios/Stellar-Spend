import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler } from '@/lib/error-handler';
import { getRevenueSummary } from '@/lib/ledger/revenue';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get('startDate')
    ? Number(searchParams.get('startDate'))
    : undefined;
  const endDate = searchParams.get('endDate') ? Number(searchParams.get('endDate')) : undefined;

  try {
    const summary = await getRevenueSummary(startDate, endDate);
    return NextResponse.json({ data: summary });
  } catch (error) {
    return ErrorHandler.serverError(error);
  }
}
