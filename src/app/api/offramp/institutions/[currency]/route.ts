import { NextResponse } from 'next/server';

// TODO: return institutions for given currency
export async function GET(_req: Request, { params }: { params: Promise<{ currency: string }> }) {
  const { currency } = await params;
  return NextResponse.json({ error: 'Not implemented', currency }, { status: 501 });
}
