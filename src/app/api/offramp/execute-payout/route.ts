import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { dal } from '@/lib/db/dal';
import type { Transaction } from '@/lib/transaction-storage';
import { calculateAllFees } from '@/lib/fee-calculation';

type FeeMethodInput = 'USDC' | 'XLM' | 'stablecoin' | 'native';

function normalizeFeeMethod(feeMethod?: FeeMethodInput): Transaction['feeMethod'] | undefined {
  if (!feeMethod) return undefined;
  if (feeMethod === 'USDC' || feeMethod === 'stablecoin') return 'stablecoin';
  if (feeMethod === 'XLM' || feeMethod === 'native') return 'native';
  return undefined;
}

export async function POST(request: NextRequest) {
  let body: Partial<Transaction> & {
    userAddress?: string;
    feeMethod?: FeeMethodInput;
    receiveAmount?: string;
  };
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
    receiveAmount,
  } = body as {
    userAddress?: string;
    amount?: string;
    currency?: string;
    beneficiary?: Transaction['beneficiary'];
    receiveAmount?: string;
  };

  if (!userAddress || !amount || !currency || !beneficiary) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  const feeMethod = normalizeFeeMethod(body.feeMethod);
  const feeBreakdown = feeMethod
    ? await calculateAllFees({ amount, currency, feeMethod, receiveAmount })
    : null;

  const id = uuidv4();
  const transaction: Transaction = {
    id,
    timestamp: Date.now(),
    userAddress,
    amount,
    currency,
    feeMethod,
    bridgeFee: feeBreakdown?.bridgeFee,
    networkFee: feeBreakdown?.networkFee,
    paycrestFee: feeBreakdown?.paycrestFee,
    totalFee: feeBreakdown?.totalFee,
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
