import { NextRequest, NextResponse } from 'next/server';
import { TransactionStorage } from '@/lib/transaction-storage';

export async function POST(req: NextRequest) {
  try {
    const { transactionId, amount, reason } = await req.json();

    if (!transactionId || !amount || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, amount, reason' },
        { status: 400 }
      );
    }

    const tx = TransactionStorage.getById(transactionId);
    if (!tx) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (!TransactionStorage.isReversalEligible(tx)) {
      return NextResponse.json(
        { error: 'Transaction is not eligible for reversal' },
        { status: 400 }
      );
    }

    const reversalAmount = parseFloat(amount);
    const txAmount = parseFloat(tx.amount);
    if (reversalAmount <= 0 || reversalAmount > txAmount) {
      return NextResponse.json(
        { error: 'Invalid reversal amount' },
        { status: 400 }
      );
    }

    TransactionStorage.reverse(transactionId, amount, reason);

    return NextResponse.json({
      success: true,
      message: 'Reversal initiated',
      transaction: TransactionStorage.getById(transactionId),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
