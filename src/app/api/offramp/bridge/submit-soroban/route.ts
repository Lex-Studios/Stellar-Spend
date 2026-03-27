import { NextRequest, NextResponse } from 'next/server';

// POST /api/offramp/bridge/submit-soroban
// Submits a signed Stellar XDR transaction to the Soroban RPC.
export async function POST(req: NextRequest) {
  try {
    const { signedXdr } = await req.json();

    if (!signedXdr) {
      return NextResponse.json({ error: 'signedXdr is required' }, { status: 400 });
    }

    const rpcUrl = process.env.STELLAR_SOROBAN_RPC_URL;
    if (!rpcUrl) {
      return NextResponse.json({ error: 'Soroban RPC URL not configured' }, { status: 500 });
    }

    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sendTransaction',
        params: { transaction: signedXdr },
      }),
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message ?? 'RPC error' }, { status: 400 });
    }

    const result = data.result;
    return NextResponse.json({
      status: result?.status ?? 'PENDING',
      hash: result?.hash,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
