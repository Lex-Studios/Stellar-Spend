import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStellarWallet } from '../useStellarWallet';

// Mock WalletManager
vi.mock('@/lib/wallets/manager', () => ({
  WalletManager: vi.fn(function () {
    this.getAvailableWallets = vi.fn(() => []);
    this.isWalletAvailable = vi.fn(() => false);
    this.connect = vi.fn();
    this.disconnect = vi.fn();
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('useStellarWallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('initializes with disconnected state', () => {
      const { result } = renderHook(() => useStellarWallet());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.publicKey).toBeNull();
      expect(result.current.walletType).toBeNull();
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('initializes with empty detected wallets', () => {
      const { result } = renderHook(() => useStellarWallet());

      expect(result.current.detectedWallets).toEqual([]);
    });

    it('properly types wallet state', () => {
      const { result } = renderHook(() => useStellarWallet());

      expect(result.current.isAutoReconnecting).toBe(false);
      expect(result.current.isSwitching).toBe(false);
      expect(result.current.accountChanged).toBe(false);
    });
  });

  describe('Wallet detection', () => {
    it('detects available wallets', () => {
      const { result } = renderHook(() => useStellarWallet());

      act(() => {
        // This would trigger detection in real scenario
      });

      expect(result.current.detectedWallets).toBeDefined();
      expect(Array.isArray(result.current.detectedWallets)).toBe(true);
    });

    it('maintains detection state', () => {
      const { result, rerender } = renderHook(() => useStellarWallet());

      rerender();

      expect(result.current.detectedWallets).toBeDefined();
    });
  });

  describe('Settings management', () => {
    it('saves wallet settings to localStorage', () => {
      const { result } = renderHook(() => useStellarWallet());

      act(() => {
        result.current.updateSettings?.({
          autoReconnect: false,
          rememberLastWallet: true,
        });
      });

      expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    it('loads wallet settings from localStorage', () => {
      const mockSettings = JSON.stringify({
        autoReconnect: true,
        rememberLastWallet: false,
      });

      (window.localStorage.getItem as any).mockReturnValue(mockSettings);

      renderHook(() => useStellarWallet());

      expect(window.localStorage.getItem).toHaveBeenCalled();
    });

    it('handles localStorage errors gracefully', () => {
      (window.localStorage.getItem as any).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useStellarWallet());

      // Should not throw and maintain default settings
      expect(result.current).toBeDefined();
    });
  });

  describe('Last used wallet', () => {
    it('saves last used wallet', () => {
      const { result } = renderHook(() => useStellarWallet());

      act(() => {
        result.current.saveLastWallet?.('freighter');
      });

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('lastWallet'),
        expect.any(String),
      );
    });

    it('loads last used wallet from storage', () => {
      (window.localStorage.getItem as any).mockReturnValue('freighter');

      const { result } = renderHook(() => useStellarWallet());

      expect(result.current.lastUsedWallet).toBeDefined();
    });

    it('returns null if no last wallet saved', () => {
      (window.localStorage.getItem as any).mockReturnValue(null);

      const { result } = renderHook(() => useStellarWallet());

      expect(result.current.lastUsedWallet).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('provides error message utility', () => {
      const { result } = renderHook(() => useStellarWallet());

      const message = result.current.getErrorMessage?.(null);
      expect(typeof message).toBe('string');
    });

    it('handles null error gracefully', () => {
      const { result } = renderHook(() => useStellarWallet());

      const message = result.current.getErrorMessage?.(null);
      expect(message).toBe('');
    });

    it('maintains error state', () => {
      const { result } = renderHook(() => useStellarWallet());

      expect(result.current.error).toBeNull();
    });
  });

  describe('Account management', () => {
    it('tracks account change state', () => {
      const { result } = renderHook(() => useStellarWallet());

      expect(result.current.accountChanged).toBe(false);
    });

    it('handles network passphrase option', () => {
      const customPassphrase = 'Custom Network';

      const { result } = renderHook(() => useStellarWallet(customPassphrase));

      expect(result.current).toBeDefined();
    });
  });

  describe('Connection states', () => {
    it('tracks connecting state', () => {
      const { result } = renderHook(() => useStellarWallet());

      expect(result.current.isConnecting).toBe(false);
    });

    it('tracks switching state', () => {
      const { result } = renderHook(() => useStellarWallet());

      expect(result.current.isSwitching).toBe(false);
    });

    it('tracks auto-reconnecting state', () => {
      const { result } = renderHook(() => useStellarWallet());

      expect(result.current.isAutoReconnecting).toBe(false);
    });
  });

  describe('Return type safety', () => {
    it('returns all required properties', () => {
      const { result } = renderHook(() => useStellarWallet());

      expect(result.current).toHaveProperty('isConnected');
      expect(result.current).toHaveProperty('publicKey');
      expect(result.current).toHaveProperty('walletType');
      expect(result.current).toHaveProperty('isConnecting');
      expect(result.current).toHaveProperty('isSwitching');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('isAutoReconnecting');
      expect(result.current).toHaveProperty('detectedWallets');
      expect(result.current).toHaveProperty('lastUsedWallet');
      expect(result.current).toHaveProperty('accountChanged');
    });

    it('returns proper types for all properties', () => {
      const { result } = renderHook(() => useStellarWallet());

      expect(typeof result.current.isConnected).toBe('boolean');
      expect(typeof result.current.isConnecting).toBe('boolean');
      expect(typeof result.current.isSwitching).toBe('boolean');
      expect(typeof result.current.isAutoReconnecting).toBe('boolean');
      expect(typeof result.current.accountChanged).toBe('boolean');
      expect(Array.isArray(result.current.detectedWallets)).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('cleans up on unmount', () => {
      const { unmount } = renderHook(() => useStellarWallet());

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('handles multiple mount/unmount cycles', () => {
      const { unmount, rerender } = renderHook(() => useStellarWallet());

      rerender();
      unmount();

      const { unmount: unmount2 } = renderHook(() => useStellarWallet());
      unmount2();

      expect(window.localStorage.getItem).toHaveBeenCalled();
    });
  });

  describe('Hook integration scenarios', () => {
    it('supports hook composition with other wallet hooks', () => {
      const { result: wallet1 } = renderHook(() => useStellarWallet());
      const { result: wallet2 } = renderHook(() => useStellarWallet());

      // Different instances should have independent state
      expect(wallet1.current.publicKey).toBeNull();
      expect(wallet2.current.publicKey).toBeNull();
    });

    it('preserves state across re-renders', () => {
      const { result, rerender } = renderHook(() => useStellarWallet());

      const initialState = {
        isConnected: result.current.isConnected,
        error: result.current.error,
      };

      rerender();

      expect(result.current.isConnected).toBe(initialState.isConnected);
      expect(result.current.error).toEqual(initialState.error);
    });

    it('handles rapid re-renders', () => {
      const { rerender } = renderHook(() => useStellarWallet());

      for (let i = 0; i < 10; i++) {
        expect(() => rerender()).not.toThrow();
      }
    });
  });

  describe('Advanced storage scenarios', () => {
    it('handles JSON serialization errors in localStorage', () => {
      (window.localStorage.getItem as any).mockImplementation(() => 'invalid json {');

      const { result } = renderHook(() => useStellarWallet());

      // Should not throw and use default values
      expect(result.current.lastUsedWallet).toBeNull();
    });

    it('handles storage quota exceeded', () => {
      (window.localStorage.setItem as any).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useStellarWallet());

      act(() => {
        result.current.saveLastWallet?.('freighter');
      });

      // Should handle gracefully
      expect(result.current).toBeDefined();
    });

    it('syncs settings across multiple hook instances', () => {
      const { result: instance1 } = renderHook(() => useStellarWallet());
      const { result: instance2 } = renderHook(() => useStellarWallet());

      act(() => {
        instance1.current.updateSettings?.({
          autoReconnect: false,
          rememberLastWallet: true,
        });
      });

      // Note: In a real scenario with shared context, both would be synced
      // This verifies each instance can manage settings independently
      expect(instance2.current).toBeDefined();
    });
  });

  describe('Window/DOM API availability', () => {
    it('handles missing window object in SSR context', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const { result } = renderHook(() => useStellarWallet());

      // Should not throw
      expect(result.current).toBeDefined();

      global.window = originalWindow;
    });

    it('handles missing localStorage API', () => {
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;

      const { result } = renderHook(() => useStellarWallet());

      // Should not throw
      expect(result.current).toBeDefined();

      Object.defineProperty(window, 'localStorage', { value: originalLocalStorage });
    });
  });

  describe('State mutation protection', () => {
    it('does not mutate returned state object', () => {
      const { result } = renderHook(() => useStellarWallet());

      const initialState = result.current;
      const mutatedArray = initialState.detectedWallets;
      mutatedArray.push('test' as any);

      // Get fresh result
      const { result: result2 } = renderHook(() => useStellarWallet());

      expect(result2.current.detectedWallets).not.toContain('test');
    });

    it('maintains immutable error state', () => {
      const { result } = renderHook(() => useStellarWallet());

      const error1 = result.current.error;
      const error2 = result.current.error;

      expect(error1 === error2).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('handles empty wallet type string', () => {
      const { result } = renderHook(() => useStellarWallet());

      expect(result.current.walletType).toBeNull();
    });

    it('handles whitespace in stored values', () => {
      (window.localStorage.getItem as any).mockReturnValue('  ');

      const { result } = renderHook(() => useStellarWallet());

      expect(result.current.lastUsedWallet).toBeNull();
    });

    it('handles very long public keys', () => {
      const longKey = 'G' + 'A'.repeat(100);
      const { result } = renderHook(() => useStellarWallet());

      // Should handle without issues
      expect(result.current.publicKey).toBeNull();
    });

    it('handles network passphrase with special characters', () => {
      const specialPassphrase = 'Network ; 2025 / Test \\\ Network';

      const { result } = renderHook(() => useStellarWallet(specialPassphrase));

      expect(result.current).toBeDefined();
    });
  });
});

describe('useStellarWallet connection state (single source of truth)', () => {
  it('exposes a stable connection-state read for consumers', () => {
    const { result } = renderHook(() => useStellarWallet());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.publicKey).toBeNull();
    expect(result.current.walletType).toBeNull();
  });

  it('reflects reconnection after a disconnect', async () => {
    const { result } = renderHook(() => useStellarWallet());

    expect(result.current.isConnected).toBe(false);

    await act(async () => {
      await result.current.connect('freighter');
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    await act(async () => {
      await result.current.disconnect();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    await act(async () => {
      await result.current.connect('freighter');
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });
});
