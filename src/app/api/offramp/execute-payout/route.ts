import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { dal } from '@/lib/db/dal';
import type { Transaction } from '@/lib/transaction-storage';

export async function POST(request: NextRequest) {
  let body: Partial<Transaction> & { userAddress?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const {
    userAddress,
    amount,
    currency,
    beneficiary,
  } = body as {
    userAddress?: string;
    amount?: string;
    currency?: string;
    beneficiary?: Transaction['beneficiary'];
  };

  if (!userAddress || !amount || !currency || !beneficiary) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  const id = uuidv4();
  const transaction: Transaction = {
    id,
    timestamp: Date.now(),
    userAddress,
    amount,
    currency,
    beneficiary,
    status: 'pending',
  };

  try {
    await dal.save(transaction);
  } catch {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }

  // TODO: proceed with bridge/payout calls using the saved transaction id
  return NextResponse.json({ id, status: 'pending' }, { status: 200 });
}
