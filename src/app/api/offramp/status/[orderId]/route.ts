import { NextResponse } from 'next/server';

// TODO: poll Paycrest order status
export async function GET(_req: Request, { params }: { params: { orderId: string } }) {
  return NextResponse.json({ error: 'Not implemented', orderId: params.orderId }, { status: 501 });
}
