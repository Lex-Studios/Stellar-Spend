import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '@/lib/env';
import { ErrorHandler } from '@/lib/error-handler';
import { generateRequestId, createRequestLogger } from '@/lib/offramp/utils/logger';
import type { PayoutStatus } from '@/lib/offramp/types';
import { mapPaycrestStatus } from '@/lib/offramp/utils/mapPaycrestStatus';
import { dal, DatabaseError } from '@/lib/db/dal';
import { enqueue } from '@/lib/webhook/dispatcher';

const SENSITIVE_HEADERS = new Set(['authorization', 'x-paycrest-signature']);

function redactHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? '[REDACTED]' : value;
  });
  return result;
}

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

  if (!await verifySignature(rawBody, signature, env.server.PAYCREST_WEBHOOK_SECRET)) {
    logger.logError(401, 'Invalid webhook signature');
    return ErrorHandler.unauthorized('Invalid signature');
  }

  // Enqueue for retry tracking — fire-and-forget, does not block the response
  enqueue(
    {
      headers: redactHeaders(request.headers),
      body: rawBody,
      source: 'paycrest',
    },
    '/api/webhooks/paycrest/process',
  ).catch((err) => {
    console.error(JSON.stringify({ requestId, event: 'webhook.enqueue_failed', error: err instanceof Error ? err.message : String(err) }));
  });

  try {
    const payload = JSON.parse(rawBody);
    const eventType: string = payload?.event ?? '';
    const orderId: string = payload?.data?.id ?? payload?.data?.orderId ?? '';
    const status = mapPaycrestStatus(eventType);

    console.log(JSON.stringify({ requestId, eventType, orderId, status }));

    const transaction = await dal.getByPayoutOrderId(orderId);
    if (!transaction) {
      console.warn(JSON.stringify({ requestId, message: 'No transaction found for orderId', orderId }));
      logger.logSuccess(200);
      return NextResponse.json({ received: true });
    }

    if (eventType === 'payment_order.settled') {
      await dal.update(transaction.id, { status: 'completed', payoutStatus: 'settled' });
    } else if (eventType === 'payment_order.pending') {
      await dal.update(transaction.id, { payoutStatus: 'pending' });
    } else {
      console.warn(`unhandled event type: ${eventType}`);
    }

    logger.logSuccess(200);
    return NextResponse.json({ received: true });
  } catch (err) {
    if (err instanceof DatabaseError) {
      logger.logError(500, err.message);
      return ErrorHandler.serverError(err);
    }
    logger.logError(400, 'Failed to parse webhook payload');
    return ErrorHandler.validation('Malformed JSON payload');
  }
}
