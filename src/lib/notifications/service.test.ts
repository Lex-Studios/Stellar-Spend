import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transaction } from '@/lib/transaction-storage';

const getPrefsMock = vi.fn();
const upsertPrefsMock = vi.fn();
const createDeliveryMock = vi.fn();

vi.mock('@/lib/notifications/preferences-store', () => ({
  getNotificationPreferences: getPrefsMock,
  upsertNotificationPreferences: upsertPrefsMock,
}));

vi.mock('@/lib/notifications/delivery-store', () => ({
  createNotificationDelivery: createDeliveryMock,
  getNotificationDeliveriesForTransaction: vi.fn(),
}));

import { notifyTransactionStatusUpdate } from '@/lib/notifications/service';

const baseTransaction: Transaction = {
  id: 'tx_notify_1',
  timestamp: Date.now(),
  userAddress: 'GUSER123',
  amount: '75',
  currency: 'NGN',
  status: 'completed',
  beneficiary: {
    institution: 'ACCESS',
    accountIdentifier: '1234567890',
    accountName: 'Jane Doe',
    currency: 'NGN',
  },
};

describe('notifyTransactionStatusUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    getPrefsMock.mockResolvedValue({
      userAddress: 'GUSER123',
      email: 'user@example.com',
      phoneNumber: '+2348000000000',
      emailEnabled: true,
      smsEnabled: false,
      notifyOnPending: true,
      notifyOnCompleted: true,
      notifyOnFailed: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    createDeliveryMock.mockResolvedValue(undefined);
  });

  it('records email delivery and skips SMS when SMS is disabled', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: 'email-1' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    process.env.EMAIL_NOTIFICATION_ENDPOINT = 'https://notify.example.com/email';
    process.env.SMS_NOTIFICATION_ENABLED = 'false';
    delete process.env.SMS_NOTIFICATION_ENDPOINT;

    await notifyTransactionStatusUpdate({
      transaction: baseTransaction,
      previousStatus: 'pending',
      source: 'webhook',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(createDeliveryMock).toHaveBeenCalledTimes(2);
    expect(createDeliveryMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        channel: 'email',
        status: 'sent',
        providerMessageId: 'email-1',
      })
    );
    expect(createDeliveryMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        channel: 'sms',
        status: 'skipped',
      })
    );
  });

  it('does not send anything when the event is unchanged', async () => {
    await notifyTransactionStatusUpdate({
      transaction: { ...baseTransaction, status: 'completed' },
      previousStatus: 'completed',
      previousPayoutStatus: undefined,
      source: 'manual_update',
    });

    expect(createDeliveryMock).not.toHaveBeenCalled();
  });
});
