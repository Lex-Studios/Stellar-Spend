import { NextResponse } from 'next/server';

// TODO: return institutions for given currency
export async function GET(_req: Request, { params }: { params: { currency: string } }) {
  return NextResponse.json(
    { error: 'Not implemented', currency: params.currency },
    { status: 501 }
  );
}
