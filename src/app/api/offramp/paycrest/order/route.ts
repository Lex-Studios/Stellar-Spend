import { NextRequest, NextResponse } from 'next/server';

// POST /api/offramp/paycrest/order
// Creates a Paycrest payout order and returns payoutOrderId + settlementAddress.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, institution, accountIdentifier, accountName, returnAddress } = body;

    if (!amount || !currency || !institution || !accountIdentifier || !accountName || !returnAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.PAYCREST_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Paycrest API key not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.paycrest.io/v1/sender/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': apiKey,
      },
      body: JSON.stringify({
        amount,
        token: 'USDC',
        network: 'stellar',
        rate: 0, // rate is computed server-side by Paycrest
        recipient: {
          institution,
          accountIdentifier,
          accountName,
          currency,
        },
        returnAddress,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message ?? 'Failed to create Paycrest order' },
        { status: res.status }
      );
    }

    return NextResponse.json({
      payoutOrderId: data.id,
      settlementAddress: data.receiveAddress,
      validUntil: data.validUntil,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
