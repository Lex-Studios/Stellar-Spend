import { NextResponse } from 'next/server';

// TODO: verify beneficiary account via Paycrest
export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
