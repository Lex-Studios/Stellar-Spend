import type { DeliveryStatus } from "./types";

export type WebhookEvent =
  | "transaction.created"
  | "transaction.completed"
  | "transaction.failed"
  | "payout.initiated"
  | "payout.completed"
  | "payout.failed"
  | "bridge.initiated"
  | "bridge.completed";

export type SubscriptionStatus = "active" | "paused" | "disabled";

export interface WebhookSubscription {
  id: string;
  endpointUrl: string;
  signingSecret: string;
  events: WebhookEvent[];
  status: SubscriptionStatus;
  rateLimitMaxPerMinute: number;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WebhookDeliveryLog {
  id: string;
  subscriptionId: string;
  event: WebhookEvent;
  payloadUrl: string;
  requestBody: string;
  responseStatus: number | null;
  responseBody: string | null;
  durationMs: number;
  status: DeliveryStatus;
  attemptCount: number;
  createdAt: number;
}
