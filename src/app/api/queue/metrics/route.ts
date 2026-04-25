import { NextResponse } from 'next/server';
import { getTransactionQueue } from '@/lib/priority-queue';

export async function GET() {
  const metrics = getTransactionQueue().getMetrics();
  return NextResponse.json({ ok: true, metrics });
}
