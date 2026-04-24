import { NextResponse, type NextRequest } from 'next/server';
import { getDetailedFeeBreakdown } from '@/lib/fee-calculation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, feeMethod, receiveAmount } = body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount: must be a positive number' },
        { status: 400 }
      );
    }

    if (!currency || typeof currency !== 'string') {
      return NextResponse.json({ error: 'currency is required' }, { status: 400 });
    }

    if (!feeMethod || !['stablecoin', 'native'].includes(feeMethod)) {
      return NextResponse.json(
        { error: 'feeMethod must be "stablecoin" or "native"' },
        { status: 400 }
      );
    }

    const feeBreakdown = await getDetailedFeeBreakdown({
      amount,
      currency,
      feeMethod,
      receiveAmount,
    });

    return NextResponse.json(feeBreakdown);
  } catch (error) {
    console.error('Fee calculation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to calculate fees',
      },
      { status: 500 }
    );
  }
}
