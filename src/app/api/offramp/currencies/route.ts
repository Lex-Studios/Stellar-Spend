import { NextResponse } from 'next/server';

// TODO: return supported fiat currencies from Paycrest
export async function GET() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
