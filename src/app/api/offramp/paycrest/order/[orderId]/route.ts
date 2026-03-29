import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export const maxDuration = 10;

import { PaycrestAdapter, PaycrestHttpError } from '@/lib/offramp/adapters/paycrest-adapter';

/**
 * GET /api/offramp/paycrest/order/[orderId]
 * 
 * Fetches the status of a Paycrest payout order.
 * 
 * Path parameters:
 * - orderId: string (required)
 * 
 * Response:
 * {
 *   data: {
 *     status: string
 *     id: string
 *     ...
 *   }
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    // Instantiate PaycrestAdapter
    const paycrest = new PaycrestAdapter(env.server.PAYCREST_API_KEY);

    // Get order status
    const order = await paycrest.getOrderStatus(orderId);

    return NextResponse.json({
      data: {
        status: order.status,
        id: order.id,
      },
    });
  } catch (err: unknown) {
    console.error('Error fetching Paycrest order status:', err);

    if (err instanceof PaycrestHttpError) {
      if (err.status === 404) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      );
    }

    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
