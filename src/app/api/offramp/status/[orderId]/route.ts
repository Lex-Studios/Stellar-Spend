import { NextResponse } from 'next/server';

// TODO: poll Paycrest order status
export async function GET(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return NextResponse.json({ error: 'Not implemented', orderId }, { status: 501 });
}
