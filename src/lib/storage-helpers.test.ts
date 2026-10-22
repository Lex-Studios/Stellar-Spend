import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readStoredJson, writeStoredJson, removeStoredItem } from './transaction-storage';

describe('transaction-storage persistence helpers', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('readStoredJson returns the fallback when the key is missing', () => {
    expect(readStoredJson('missing', [1])).toEqual([1]);
  });

  it('readStoredJson returns the fallback on malformed JSON', () => {
    store.set('bad', '{not json');
    expect(readStoredJson('bad', { ok: false })).toEqual({ ok: false });
  });

  it('writeStoredJson round-trips through readStoredJson', () => {
    expect(writeStoredJson('k', { a: 1 })).toBe(true);
    expect(readStoredJson('k', {})).toEqual({ a: 1 });
  });

  it('writeStoredJson returns false when storage throws', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    expect(writeStoredJson('k', {})).toBe(false);
  });

  it('removeStoredItem deletes the key', () => {
    store.set('k', '1');
    removeStoredItem('k');
    expect(store.has('k')).toBe(false);
  });

  it('is a no-op on the server (no window)', () => {
    vi.stubGlobal('window', undefined);
    expect(readStoredJson('k', 'fallback')).toBe('fallback');
    expect(writeStoredJson('k', 'x')).toBe(false);
  });
});
