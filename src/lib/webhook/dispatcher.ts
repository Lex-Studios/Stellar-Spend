import { randomUUID } from "crypto";
import type { DeliveryRecord, DeliveryAttempt, WebhookPayload } from "./types";
import { createRecord, updateRecord } from "./delivery-store";
import { getWebhookConfig } from "./config";

export interface DeliveryAttemptResult {
    success: boolean;
    retryable: boolean;
    httpStatus?: number;
    errorType?: string;
    durationMs: number;
}

/**
 * Enqueue a new delivery record for the given payload and destination.
 */
export async function enqueue(
    payload: WebhookPayload,
    destination: string,
): Promise<DeliveryRecord> {
    const config = getWebhookConfig();
    return createRecord(destination, payload, config.maxAttempts);
}

/**
 * Execute a single delivery attempt for the given record.
 * Performs an HTTP POST, records the outcome, and updates the record in the store.
 */
export async function attempt(record: DeliveryRecord): Promise<DeliveryAttemptResult> {
    const attemptNumber = record.attemptCount + 1;
    const startTime = Date.now();
    let httpStatus: number | undefined;
    let errorType: string | undefined;
    let success = false;
    let retryable = false;

    try {
        const response = await fetch(record.destinationUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...record.payload.headers,
            },
            body: record.payload.body,
        });

        httpStatus = response.status;
        const durationMs = Date.now() - startTime;

        if (httpStatus >= 200 && httpStatus < 300) {
            success = true;
            retryable = false;
        } else if (httpStatus === 429) {
            success = false;
            retryable = true;
        } else if (httpStatus >= 400 && httpStatus < 500) {
            // 4xx (except 429) — non-retryable
            success = false;
            retryable = false;
        } else {
            // 5xx
            success = false;
            retryable = true;
        }

        const deliveryAttempt: DeliveryAttempt = {
            attemptNumber,
            timestamp: new Date().toISOString(),
            httpStatus,
            durationMs,
        };

        const updatedAttempts = [...record.attempts, deliveryAttempt];

        await updateRecord(record.id, {
            attemptCount: attemptNumber,
            attempts: updatedAttempts,
        });

        console.log(
            JSON.stringify({
                requestId: randomUUID(),
                timestamp: new Date().toISOString(),
                event: "webhook.attempt",
                deliveryId: record.id,
                attemptNumber,
                destinationUrl: record.destinationUrl,
                httpStatus,
                durationMs,
                success,
                retryable,
            }),
        );

        return { success, retryable, httpStatus, durationMs };
    } catch (err) {
        const durationMs = Date.now() - startTime;
        errorType = isTimeoutError(err) ? "TIMEOUT" : "NETWORK_ERROR";
        retryable = true;

        const deliveryAttempt: DeliveryAttempt = {
            attemptNumber,
            timestamp: new Date().toISOString(),
            errorType,
            durationMs,
        };

        const updatedAttempts = [...record.attempts, deliveryAttempt];

        await updateRecord(record.id, {
            attemptCount: attemptNumber,
            attempts: updatedAttempts,
        });

        console.log(
            JSON.stringify({
                requestId: randomUUID(),
                timestamp: new Date().toISOString(),
                event: "webhook.attempt",
                deliveryId: record.id,
                attemptNumber,
                destinationUrl: record.destinationUrl,
                errorType,
                durationMs,
                success: false,
                retryable: true,
                error: err instanceof Error ? err.message : String(err),
            }),
        );

        return { success: false, retryable: true, errorType, durationMs };
    }
}

/**
 * Mark a record as successfully delivered.
 */
export async function markDelivered(recordId: string, attemptCount: number): Promise<void> {
    await updateRecord(recordId, {
        status: "delivered",
        attemptCount,
        nextAttemptAt: null,
    });

    console.log(
        JSON.stringify({
            requestId: randomUUID(),
            timestamp: new Date().toISOString(),
            event: "webhook.delivered",
            deliveryId: recordId,
            attemptCount,
        }),
    );
}

/**
 * Mark a record as permanently failed and clear the next retry time.
 */
export async function markFailed(record: DeliveryRecord): Promise<void> {
    await updateRecord(record.id, {
        status: "failed",
        nextAttemptAt: null,
    });

    console.log(
        JSON.stringify({
            requestId: randomUUID(),
            timestamp: new Date().toISOString(),
            event: "webhook.failed",
            deliveryId: record.id,
            destinationUrl: record.destinationUrl,
            attemptCount: record.attemptCount,
        }),
    );
}

function isTimeoutError(err: unknown): boolean {
    if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        return msg.includes("timeout") || msg.includes("timed out") || err.name === "AbortError";
    }
    return false;
}
