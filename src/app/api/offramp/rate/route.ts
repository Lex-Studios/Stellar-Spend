import { NextResponse } from 'next/server';

export const maxDuration = 10;

export async function GET() {
  try {
    const res = await fetch('https://api.paycrest.io/v1/rates/USDC/1/NGN?network=base', {
      next: { revalidate: 0 },
    });
    if (!res.ok) return NextResponse.json({ error: 'unavailable' }, { status: 502 });
    const data = await res.json();
    const rate = parseFloat(data.rate ?? '0');
    if (!rate || rate <= 0) return NextResponse.json({ error: 'invalid rate' }, { status: 502 });
    return NextResponse.json({ rate });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
