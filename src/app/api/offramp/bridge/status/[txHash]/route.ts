import { NextResponse } from 'next/server';

// TODO: poll Allbridge bridge transfer status
export async function GET(_req: Request, { params }: { params: Promise<{ txHash: string }> }) {
  const { txHash } = await params;
  return NextResponse.json({ error: 'Not implemented', txHash }, { status: 501 });
}
