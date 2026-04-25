import type { Transaction } from '@/lib/transaction-storage';

export type NotificationChannel = 'email' | 'sms';
export type NotificationDeliveryStatus = 'sent' | 'failed' | 'skipped';
export type TransactionNotificationEvent = 'pending' | 'completed' | 'failed';

export interface NotificationPreferences {
  userAddress: string;
  email?: string;
  phoneNumber?: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  notifyOnPending: boolean;
  notifyOnCompleted: boolean;
  notifyOnFailed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NotificationTemplate {
  templateId: string;
  subject: string;
  message: string;
}

export interface NotificationDeliveryRecord {
  id: string;
  transactionId: string;
  userAddress: string;
  eventType: TransactionNotificationEvent;
  channel: NotificationChannel;
  destination?: string;
  status: NotificationDeliveryStatus;
  templateId: string;
  subject?: string;
  message: string;
  providerMessageId?: string;
  errorMessage?: string;
  attemptCount: number;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  sentAt?: number;
}

export interface NotificationContext {
  transaction: Transaction;
  previousStatus?: Transaction['status'];
  previousPayoutStatus?: string;
  source: 'webhook' | 'refund' | 'timeout' | 'manual_update';
}

export interface DeliveryResult {
  status: NotificationDeliveryStatus;
  providerMessageId?: string;
  errorMessage?: string;
}
