import { logger } from '@/lib/logger';
import { readStoredJson, writeStoredJson, removeStoredItem } from '@/lib/transaction-storage';
/**
 * Sync Storage
 * Manages client-side sync state and metadata for transaction history synchronization.
 * Persistence goes through the shared helpers in transaction-storage.ts.
 */

export interface SyncSettings {
  syncEnabled: boolean;
  lastSyncAt: number;
  lastServerSyncAt: number;
  conflictResolutionStrategy: 'last-write-wins';
}

export interface SyncMetadata {
  transactionId: string;
  localVersion: number;
  serverVersion: number;
  lastModifiedAt: number;
  lastSyncedAt?: number;
  conflict?: boolean;
}

type SyncQueueItem = {
  transactionId: string;
  action: 'create' | 'update' | 'delete';
  queuedAt: number;
};

const SYNC_SETTINGS_KEY = 'stellar_spend_sync_settings';
const SYNC_METADATA_KEY = 'stellar_spend_sync_metadata';
const SYNC_QUEUE_KEY = 'stellar_spend_sync_queue';

export class SyncStorage {
  /**
   * Get or initialize sync settings
   */
  static getSettings(): SyncSettings {
    return readStoredJson(SYNC_SETTINGS_KEY, this.getDefaultSettings());
  }

  /**
   * Update sync settings
   */
  static updateSettings(updates: Partial<SyncSettings>): SyncSettings {
    if (typeof window === 'undefined') return this.getDefaultSettings();

    const updated: SyncSettings = { ...this.getSettings(), ...updates };
    writeStoredJson(SYNC_SETTINGS_KEY, updated);
    return updated;
  }

  /**
   * Toggle sync on/off
   */
  static toggleSync(enabled: boolean): SyncSettings {
    return this.updateSettings({ syncEnabled: enabled });
  }

  /**
   * Get default sync settings
   */
  static getDefaultSettings(): SyncSettings {
    return {
      syncEnabled: false, // opt-in for privacy
      lastSyncAt: 0,
      lastServerSyncAt: 0,
      conflictResolutionStrategy: 'last-write-wins',
    };
  }

  /**
   * Get sync metadata for a transaction
   */
  static getMetadata(transactionId: string): SyncMetadata | undefined {
    return this.getAllMetadata()[transactionId];
  }

  /**
   * Set sync metadata for a transaction
   */
  static setMetadata(transactionId: string, metadata: SyncMetadata): void {
    if (typeof window === 'undefined') return;

    const allMetadata = this.getAllMetadata();
    allMetadata[transactionId] = metadata;
    if (!writeStoredJson(SYNC_METADATA_KEY, allMetadata)) {
      logger.error('Failed to set sync metadata:', {}, transactionId);
    }
  }

  /**
   * Get all sync metadata
   */
  static getAllMetadata(): Record<string, SyncMetadata> {
    return readStoredJson<Record<string, SyncMetadata>>(SYNC_METADATA_KEY, {});
  }

  /**
   * Add transaction to sync queue
   */
  static addToQueue(transactionId: string, action: 'create' | 'update' | 'delete'): void {
    if (typeof window === 'undefined') return;

    // Remove duplicate entry if exists
    const filtered = this.getQueue().filter((item) => item.transactionId !== transactionId);
    filtered.push({ transactionId, action, queuedAt: Date.now() });

    if (!writeStoredJson(SYNC_QUEUE_KEY, filtered)) {
      logger.error('Failed to add to sync queue:', {});
    }
  }

  /**
   * Get sync queue
   */
  static getQueue(): SyncQueueItem[] {
    return readStoredJson<SyncQueueItem[]>(SYNC_QUEUE_KEY, []);
  }

  /**
   * Clear sync queue
   */
  static clearQueue(): void {
    removeStoredItem(SYNC_QUEUE_KEY);
  }

  /**
   * Remove item from sync queue
   */
  static removeFromQueue(transactionId: string): void {
    if (typeof window === 'undefined') return;

    const filtered = this.getQueue().filter((item) => item.transactionId !== transactionId);
    if (!writeStoredJson(SYNC_QUEUE_KEY, filtered)) {
      logger.error('Failed to remove from sync queue:', {});
    }
  }

  /**
   * Mark sync complete
   */
  static markSyncComplete(_userAddress: string): void {
    this.updateSettings({
      lastSyncAt: Date.now(),
      lastServerSyncAt: Date.now(),
    });
  }

  /**
   * Clear all sync data (for logout or reset)
   */
  static clear(): void {
    removeStoredItem(SYNC_SETTINGS_KEY);
    removeStoredItem(SYNC_METADATA_KEY);
    removeStoredItem(SYNC_QUEUE_KEY);
  }
}
