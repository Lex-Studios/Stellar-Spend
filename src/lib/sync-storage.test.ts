import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SyncStorage } from '../sync-storage';

describe('SyncStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Settings Management', () => {
    it('should return default settings when none exist', () => {
      const settings = SyncStorage.getSettings();
      expect(settings.syncEnabled).toBe(false);
      expect(settings.conflictResolutionStrategy).toBe('last-write-wins');
    });

    it('should update settings', () => {
      const updated = SyncStorage.updateSettings({ syncEnabled: true });
      expect(updated.syncEnabled).toBe(true);

      const retrieved = SyncStorage.getSettings();
      expect(retrieved.syncEnabled).toBe(true);
    });

    it('should toggle sync', () => {
      let settings = SyncStorage.toggleSync(true);
      expect(settings.syncEnabled).toBe(true);

      settings = SyncStorage.toggleSync(false);
      expect(settings.syncEnabled).toBe(false);
    });
  });

  describe('Metadata Management', () => {
    it('should store and retrieve transaction metadata', () => {
      const metadata = {
        transactionId: 'tx1',
        localVersion: 1,
        serverVersion: 1,
        lastModifiedAt: Date.now(),
      };

      SyncStorage.setMetadata('tx1', metadata);
      const retrieved = SyncStorage.getMetadata('tx1');

      expect(retrieved).toEqual(metadata);
    });

    it('should return undefined for non-existent metadata', () => {
      const retrieved = SyncStorage.getMetadata('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should retrieve all metadata', () => {
      const metadata1 = {
        transactionId: 'tx1',
        localVersion: 1,
        serverVersion: 1,
        lastModifiedAt: Date.now(),
      };

      const metadata2 = {
        transactionId: 'tx2',
        localVersion: 2,
        serverVersion: 2,
        lastModifiedAt: Date.now(),
      };

      SyncStorage.setMetadata('tx1', metadata1);
      SyncStorage.setMetadata('tx2', metadata2);

      const all = SyncStorage.getAllMetadata();
      expect(Object.keys(all)).toHaveLength(2);
      expect(all['tx1']).toEqual(metadata1);
      expect(all['tx2']).toEqual(metadata2);
    });
  });

  describe('Queue Management', () => {
    it('should add transaction to queue', () => {
      SyncStorage.addToQueue('tx1', 'create');
      const queue = SyncStorage.getQueue();

      expect(queue).toHaveLength(1);
      expect(queue[0].transactionId).toBe('tx1');
      expect(queue[0].action).toBe('create');
    });

    it('should prevent duplicate entries in queue', () => {
      SyncStorage.addToQueue('tx1', 'create');
      SyncStorage.addToQueue('tx1', 'update');
      const queue = SyncStorage.getQueue();

      expect(queue).toHaveLength(1);
      expect(queue[0].action).toBe('update');
    });

    it('should remove item from queue', () => {
      SyncStorage.addToQueue('tx1', 'create');
      SyncStorage.addToQueue('tx2', 'update');
      SyncStorage.removeFromQueue('tx1');

      const queue = SyncStorage.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].transactionId).toBe('tx2');
    });

    it('should clear entire queue', () => {
      SyncStorage.addToQueue('tx1', 'create');
      SyncStorage.addToQueue('tx2', 'update');
      SyncStorage.clearQueue();

      const queue = SyncStorage.getQueue();
      expect(queue).toHaveLength(0);
    });
  });

  describe('Sync Completion', () => {
    it('should update sync timestamps on completion', () => {
      SyncStorage.markSyncComplete('0x123');
      const settings = SyncStorage.getSettings();

      expect(settings.lastSyncAt).toBeGreaterThan(0);
      expect(settings.lastServerSyncAt).toBeGreaterThan(0);
    });
  });

  describe('Clear', () => {
    it('should clear all sync data', () => {
      SyncStorage.updateSettings({ syncEnabled: true });
      SyncStorage.setMetadata('tx1', {
        transactionId: 'tx1',
        localVersion: 1,
        serverVersion: 1,
        lastModifiedAt: Date.now(),
      });
      SyncStorage.addToQueue('tx1', 'create');

      SyncStorage.clear();

      const settings = SyncStorage.getSettings();
      const metadata = SyncStorage.getAllMetadata();
      const queue = SyncStorage.getQueue();

      // After clear, should get default settings
      expect(settings.syncEnabled).toBe(false);
      expect(Object.keys(metadata)).toHaveLength(0);
      expect(queue).toHaveLength(0);
    });
  });
});
