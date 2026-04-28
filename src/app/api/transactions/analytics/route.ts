import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/services/analytics-service';
import { getFunnelCounts } from '@/lib/performance';
import { buildFunnelData } from '@/lib/funnel';
import type { FunnelStep } from '@/lib/funnel';

export async function GET(req: NextRequest) {
  try {
    const userAddress = req.headers.get('x-user-address');
    if (!userAddress) {
      return NextResponse.json({ error: 'User address required' }, { status: 401 });
    }

    const startDate = parseInt(req.nextUrl.searchParams.get('startDate') || '0');
    const endDate = parseInt(req.nextUrl.searchParams.get('endDate') || Date.now().toString());

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const analytics = await analyticsService.getAnalytics(userAddress, startDate, endDate);
    const funnel = buildFunnelData(getFunnelCounts() as Partial<Record<FunnelStep, number>>);

    return NextResponse.json({ ...analytics, funnel });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
