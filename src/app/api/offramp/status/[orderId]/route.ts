import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

const PAYCREST_BASE_URL = 'https://api.paycrest.io/v1';

export async function GET(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  try {
    const res = await fetch(`${PAYCREST_BASE_URL}/sender/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${env.server.PAYCREST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: body.message ?? 'Failed to fetch order status' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ status: data.status, id: orderId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
