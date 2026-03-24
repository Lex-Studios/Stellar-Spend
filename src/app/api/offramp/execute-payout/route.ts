import { NextResponse } from 'next/server';

// TODO: execute payout via Base USDC transfer + Paycrest order
export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
