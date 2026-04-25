import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { ErrorHandler } from '@/lib/error-handler';
import { generateRequestId, createRequestLogger } from '@/lib/offramp/utils/logger';
import type { PayoutStatus } from '@/lib/offramp/types';
import { mapPaycrestStatus } from '@/lib/offramp/utils/mapPaycrestStatus';
import { dal, DatabaseError } from '@/lib/db/dal';
import { enqueue } from '@/lib/webhook/dispatcher';
import { verifyWebhookSignature } from '@/lib/webhook/security';
import { notifyTransactionStatusUpdate } from '@/lib/notifications/service';

const SENSITIVE_HEADERS = new Set(['authorization', 'x-paycrest-signature']);

function redactHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? '[REDACTED]' : value;
  });
  return result;
}

export const maxDuration = 10;

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId, 'POST', '/api/webhooks/paycrest');

  // Read raw body first — must happen before any JSON parsing
  const rawBody = await request.text();
  const signature = request.headers.get('X-Paycrest-Signature') ?? '';
  const timestamp = request.headers.get('X-Paycrest-Timestamp');
  const nonce = request.headers.get('X-Paycrest-Nonce');

  const verification = await verifyWebhookSignature(
    rawBody,
    signature,
    env.server.PAYCREST_WEBHOOK_SECRET,
    timestamp,
    nonce
  );

  if (!verification.valid) {
    logger.logError(401, verification.reason ?? 'Invalid webhook signature');
    return ErrorHandler.unauthorized(verification.reason ?? 'Invalid signature');
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

    let updates: Record<string, unknown> | null = null;
    if (eventType === 'payment_order.settled') {
      updates = { status: 'completed', payoutStatus: 'settled' };
    } else if (eventType === 'payment_order.pending') {
      updates = { payoutStatus: 'pending' };
    } else if (eventType === 'payment_order.refunded') {
      updates = { status: 'failed', payoutStatus: 'refunded', error: 'Refunded by Paycrest' };
      console.log(JSON.stringify({ requestId, event: 'refund.received', orderId, transactionId: transaction.id }));
    } else if (eventType === 'payment_order.expired') {
      updates = { status: 'failed', payoutStatus: 'expired', error: 'Order expired' };
      console.log(JSON.stringify({ requestId, event: 'order.expired', orderId, transactionId: transaction.id }));
    } else {
      console.warn(`unhandled event type: ${eventType}`);
    }

    if (updates) {
      await dal.update(transaction.id, updates);
      const updated = await dal.getById(transaction.id);
      if (updated) {
        await notifyTransactionStatusUpdate({
          transaction: updated,
          previousStatus: transaction.status,
          previousPayoutStatus: transaction.payoutStatus,
          source: 'webhook',
        });
      }
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
