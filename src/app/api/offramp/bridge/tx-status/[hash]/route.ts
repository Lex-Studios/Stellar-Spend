import { NextRequest, NextResponse } from 'next/server';
import { extractErrorMessage } from '@/lib/offramp/utils/errors';

export const maxDuration = 10;

/**
 * GET /api/offramp/bridge/tx-status/[hash]
 * 
 * Polls the Soroban RPC for a transaction's status.
 * 
 * Response:
 * {
 *   status: 'SUCCESS' | 'FAILED' | 'NOT_FOUND'
 *   hash: string
 * }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;

  const rpcUrl = process.env.STELLAR_SOROBAN_RPC_URL;
  if (!rpcUrl) {
    return NextResponse.json({ error: 'Soroban RPC URL not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: { hash },
      }),
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message ?? 'RPC error' }, { status: 400 });
    }

    const rpcStatus = data.result?.status ?? 'NOT_FOUND';

    // Map RPC status to simplified status
    let status: 'SUCCESS' | 'FAILED' | 'NOT_FOUND';
    if (rpcStatus === 'SUCCESS') {
      status = 'SUCCESS';
    } else if (rpcStatus === 'FAILED') {
      status = 'FAILED';
    } else {
      status = 'NOT_FOUND';
    }

    return NextResponse.json({ status, hash });
  } catch (err: unknown) {
    const message = extractErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
