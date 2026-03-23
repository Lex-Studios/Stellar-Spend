import { NextResponse } from 'next/server';

// TODO: poll Allbridge bridge transfer status
export async function GET(_req: Request, { params }: { params: { txHash: string } }) {
  return NextResponse.json({ error: 'Not implemented', txHash: params.txHash }, { status: 501 });
}
