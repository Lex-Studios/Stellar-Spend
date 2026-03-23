import { NextResponse } from 'next/server';

// TODO: build Stellar bridge transaction XDR via Allbridge
export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
