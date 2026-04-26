import { NextRequest, NextResponse } from 'next/server';
import { createBatch, addTransactionToBatch, getBatchStatus } from '@/lib/services/batch.service';

export async function POST(req: NextRequest) {
  try {
    const { userId, transactions } = await req.json();

    const totalAmount = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    const batch = await createBatch(userId, totalAmount);

    for (const tx of transactions) {
      await addTransactionToBatch(batch.id, tx);
    }

    return NextResponse.json({ batchId: batch.id, status: 'created' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const batchId = req.nextUrl.searchParams.get('batchId');
    if (!batchId) {
      return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
    }

    const status = await getBatchStatus(batchId);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get batch status' },
      { status: 500 }
    );
  }
}
