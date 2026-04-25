import {
  createNotificationDelivery,
  getNotificationDeliveriesForTransaction,
} from '@/lib/notifications/delivery-store';
import {
  getNotificationPreferences,
  upsertNotificationPreferences,
} from '@/lib/notifications/preferences-store';
import { buildNotificationTemplate, deriveNotificationEvent } from '@/lib/notifications/templates';
import type {
  DeliveryResult,
  NotificationChannel,
  NotificationContext,
  NotificationPreferences,
} from '@/lib/notifications/types';
import type { Transaction } from '@/lib/transaction-storage';

function boolFromEnv(name: string, fallback = false): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw.toLowerCase() === 'true';
}

function getNotificationConfig() {
  return {
    emailEndpoint: process.env.EMAIL_NOTIFICATION_ENDPOINT,
    emailAuthToken: process.env.EMAIL_NOTIFICATION_AUTH_TOKEN,
    emailFrom: process.env.EMAIL_NOTIFICATION_FROM ?? 'noreply@stellar-spend.local',
    smsEndpoint: process.env.SMS_NOTIFICATION_ENDPOINT,
    smsAuthToken: process.env.SMS_NOTIFICATION_AUTH_TOKEN,
    smsEnabled: boolFromEnv('SMS_NOTIFICATION_ENABLED', false),
  };
}

function shouldSendForEvent(preferences: NotificationPreferences, event: 'pending' | 'completed' | 'failed') {
  if (event === 'pending') return preferences.notifyOnPending;
  if (event === 'completed') return preferences.notifyOnCompleted;
  return preferences.notifyOnFailed;
}

function getProviderMessageId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const candidate = (payload as Record<string, unknown>).messageId;
  return typeof candidate === 'string' ? candidate : undefined;
}

async function deliverEmail(to: string, subject: string, message: string): Promise<DeliveryResult> {
  const config = getNotificationConfig();
  if (!config.emailEndpoint) {
    return {
      status: 'skipped',
      errorMessage: 'EMAIL_NOTIFICATION_ENDPOINT is not configured',
    };
  }

  const response = await fetch(config.emailEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.emailAuthToken ? { Authorization: `Bearer ${config.emailAuthToken}` } : {}),
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to,
      subject,
      text: message,
    }),
  });

  if (!response.ok) {
    return {
      status: 'failed',
      errorMessage: `Email endpoint responded with HTTP ${response.status}`,
    };
  }

  const payload = await response.json().catch(() => ({}));
  return {
    status: 'sent',
    providerMessageId: getProviderMessageId(payload),
  };
}

async function deliverSms(to: string, message: string): Promise<DeliveryResult> {
  const config = getNotificationConfig();
  if (!config.smsEnabled || !config.smsEndpoint) {
    return {
      status: 'skipped',
      errorMessage: 'SMS notifications are not configured',
    };
  }

  const response = await fetch(config.smsEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.smsAuthToken ? { Authorization: `Bearer ${config.smsAuthToken}` } : {}),
    },
    body: JSON.stringify({ to, message }),
  });

  if (!response.ok) {
    return {
      status: 'failed',
      errorMessage: `SMS endpoint responded with HTTP ${response.status}`,
    };
  }

  const payload = await response.json().catch(() => ({}));
  return {
    status: 'sent',
    providerMessageId: getProviderMessageId(payload),
  };
}

export async function getOrCreateNotificationPreferences(
  userAddress: string
): Promise<NotificationPreferences> {
  const existing = await getNotificationPreferences(userAddress);
  if (existing) return existing;

  return upsertNotificationPreferences({
    userAddress,
    emailEnabled: true,
    smsEnabled: false,
    notifyOnPending: true,
    notifyOnCompleted: true,
    notifyOnFailed: true,
  });
}

async function sendViaChannel(
  channel: NotificationChannel,
  preferences: NotificationPreferences,
  subject: string,
  message: string
): Promise<{ destination?: string; result: DeliveryResult }> {
  if (channel === 'email') {
    if (!preferences.emailEnabled || !preferences.email) {
      return {
        destination: preferences.email,
        result: {
          status: 'skipped',
          errorMessage: 'Email notifications are disabled or no email is configured',
        },
      };
    }
    return {
      destination: preferences.email,
      result: await deliverEmail(preferences.email, subject, message),
    };
  }

  if (!preferences.smsEnabled || !preferences.phoneNumber) {
    return {
      destination: preferences.phoneNumber,
      result: {
        status: 'skipped',
        errorMessage: 'SMS notifications are disabled or no phone number is configured',
      },
    };
  }

  return {
    destination: preferences.phoneNumber,
    result: await deliverSms(preferences.phoneNumber, message),
  };
}

export async function notifyTransactionStatusUpdate(context: NotificationContext): Promise<void> {
  const event = deriveNotificationEvent(context);
  if (!event) return;

  const template = buildNotificationTemplate(context);
  if (!template) return;

  const preferences = await getOrCreateNotificationPreferences(context.transaction.userAddress);
  if (!shouldSendForEvent(preferences, event)) return;

  for (const channel of ['email', 'sms'] as const) {
    const { destination, result } = await sendViaChannel(
      channel,
      preferences,
      template.subject,
      template.message
    );

    await createNotificationDelivery({
      transactionId: context.transaction.id,
      userAddress: context.transaction.userAddress,
      eventType: event,
      channel,
      destination,
      status: result.status,
      templateId: template.templateId,
      subject: template.subject,
      message: template.message,
      providerMessageId: result.providerMessageId,
      errorMessage: result.errorMessage,
      attemptCount: 1,
      metadata: {
        source: context.source,
        payoutStatus: context.transaction.payoutStatus,
      },
      sentAt: result.status === 'sent' ? Date.now() : undefined,
    });
  }
}

export async function getTransactionNotificationDeliveries(transactionId: string) {
  return getNotificationDeliveriesForTransaction(transactionId);
}

export type { NotificationPreferences } from '@/lib/notifications/types';
export type { Transaction };
