import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '@/lib/env';
import { ErrorHandler } from '@/lib/error-handler';
import { generateRequestId, createRequestLogger } from '@/lib/offramp/utils/logger';
import type { PayoutStatus } from '@/lib/offramp/types';
import { mapPaycrestStatus } from '@/lib/offramp/utils/mapPaycrestStatus';

export const maxDuration = 10;

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computed = Buffer.from(mac).toString('hex');
  // Timing-safe comparison via fixed-length XOR
  if (computed.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId, 'POST', '/api/webhooks/paycrest');

  // Read raw body first — must happen before any JSON parsing
  const rawBody = await request.text();
  const signature = request.headers.get('X-Paycrest-Signature') ?? '';

  if (!verifySignature(rawBody, signature, env.server.PAYCREST_WEBHOOK_SECRET)) {
    logger.logError(401, 'Invalid webhook signature');
    return ErrorHandler.unauthorized('Invalid signature');
  }

  try {
    const payload = JSON.parse(rawBody);
    const eventType: string = payload?.event ?? '';
    const orderId: string = payload?.data?.id ?? payload?.data?.orderId ?? '';
    const status = mapPaycrestStatus(eventType);

    console.log(JSON.stringify({ requestId, eventType, orderId, status }));

    logger.logSuccess(200);
    return NextResponse.json({ received: true });
  } catch {
    logger.logError(400, 'Failed to parse webhook payload');
    return ErrorHandler.validation('Malformed JSON payload');
  }
}
