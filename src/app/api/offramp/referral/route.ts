import { NextRequest, NextResponse } from 'next/server';
import {
  createReferralCode,
  getReferralCode,
  trackReferral,
  getReferralStats,
} from '@/lib/services/referral.service';

export async function POST(req: NextRequest) {
  try {
    const { userId, action, referralCode } = await req.json();

    if (action === 'generate') {
      const code = await createReferralCode(userId);
      return NextResponse.json({ code });
    }

    if (action === 'track') {
      const reward = await trackReferral(referralCode, userId);
      return NextResponse.json({ reward });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const code = await getReferralCode(userId);
    const stats = await getReferralStats(userId);

    return NextResponse.json({ code, stats });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get referral data' },
      { status: 500 }
    );
  }
}
