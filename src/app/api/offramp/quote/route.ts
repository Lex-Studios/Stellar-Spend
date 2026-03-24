import { NextResponse } from 'next/server';
// import { PAYCREST_API_KEY } from '@/lib/env';

// TODO: implement quote logic using Paycrest + Allbridge
export async function POST() {
  // Example of using the centralized env config
  // const apiKey = PAYCREST_API_KEY;

  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
