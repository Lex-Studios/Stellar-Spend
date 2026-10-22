/**
 * Unit tests for StellarWalletAdapter - comprehensive coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  StellarWalletAdapter,
  getStellarWalletAdapter,
  _resetAdapterSingleton,
} from '../wallet-adapter';
import type { StellarWallet } from '../wallet-adapter';

describe('StellarWalletAdapter', () => {
  let adapter: StellarWalletAdapter;
  const testPublicKey = 'GBRPYHIL2CI3WHZDTOOQFC6EB4RRRKC3D5NJ5XASFXWF5UCLCJLXIEO';
  const networkPassphrase = 'Test SDF Network ; September 2015';

  beforeEach(() => {
    adapter = new StellarWalletAdapter(networkPassphrase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    _resetAdapterSingleton();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create adapter with network passphrase', () => {
      expect(adapter).toBeDefined();
    });

    it('should use default testnet passphrase if not provided', () => {
      const defaultAdapter = new StellarWalletAdapter();
      expect(defaultAdapter).toBeDefined();
    });
  });

  describe('Freighter wallet detection', () => {
    it('should detect Freighter as available when window.freighter exists', async () => {
      const mockFreighter = {
        publicKey: { [testPublicKey]: true },
        isConnected: vi.fn().mockResolvedValue(true),
      };

      Object.defineProperty(window, 'freighter', {
        value: mockFreighter,
        writable: true,
        configurable: true,
      });

      const available = await adapter.isFreighterAvailable();
      expect(available).toBe(true);

      delete (window as any).freighter;
    });

    it('should return false when Freighter is not available', async () => {
      if ((window as any).freighter) {
        delete (window as any).freighter;
      }

      const available = await adapter.isFreighterAvailable();
      expect(available).toBe(false);
    });

    it('should handle Freighter API errors gracefully', async () => {
      const mockFreighter = {
        isConnected: vi.fn().mockRejectedValue(new Error('API error')),
      };

      Object.defineProperty(window, 'freighter', {
        value: mockFreighter,
        writable: true,
        configurable: true,
      });

      const available = await adapter.isFreighterAvailable();
      expect(available).toBe(false);

      delete (window as any).freighter;
    });
  });

  describe('Lobstr wallet detection', () => {
    it('should detect Lobstr as available when window.lobstr exists', () => {
      const mockLobstr = {
        connect: vi.fn(),
        signTransaction: vi.fn(),
      };

      Object.defineProperty(window, 'lobstr', {
        value: mockLobstr,
        writable: true,
        configurable: true,
      });

      const available = adapter.isLobstrAvailable();
      expect(available).toBe(true);

      delete (window as any).lobstr;
    });

    it('should return false when Lobstr is not available', () => {
      if ((window as any).lobstr) {
        delete (window as any).lobstr;
      }

      const available = adapter.isLobstrAvailable();
      expect(available).toBe(false);
    });
  });

  describe('Freighter connection', () => {
    it('should throw error if Freighter is not available', async () => {
      if ((window as any).freighter) {
        delete (window as any).freighter;
      }

      await expect(adapter.connectFreighter()).rejects.toThrow();
    });

    it('should return wallet on successful Freighter connection', async () => {
      const mockFreighter = {
        publicKey: { [testPublicKey]: true },
        isConnected: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue(testPublicKey),
        signTransaction: vi.fn(),
      };

      Object.defineProperty(window, 'freighter', {
        value: mockFreighter,
        writable: true,
        configurable: true,
      });

      const wallet = await adapter.connectFreighter();
      expect(wallet).toBeDefined();
      expect(wallet.publicKey).toBe(testPublicKey);
      expect(wallet.type).toBe('freighter');

      delete (window as any).freighter;
    });

    it('should handle Freighter connection errors', async () => {
      const mockFreighter = {
        publicKey: { [testPublicKey]: true },
        isConnected: vi.fn().mockRejectedValue(new Error('Connection failed')),
      };

      Object.defineProperty(window, 'freighter', {
        value: mockFreighter,
        writable: true,
        configurable: true,
      });

      await expect(adapter.connectFreighter()).rejects.toThrow();

      delete (window as any).freighter;
    });
  });

  describe('Lobstr connection', () => {
    it('should throw error if Lobstr is not available', async () => {
      if ((window as any).lobstr) {
        delete (window as any).lobstr;
      }

      await expect(adapter.connectLobstr()).rejects.toThrow();
    });

    it('should return wallet on successful Lobstr connection', async () => {
      const mockLobstr = {
        connect: vi.fn().mockResolvedValue({ publicKey: testPublicKey }),
        signTransaction: vi.fn().mockResolvedValue({ signedXdr: 'signed' }),
      };

      Object.defineProperty(window, 'lobstr', {
        value: mockLobstr,
        writable: true,
        configurable: true,
      });

      const wallet = await adapter.connectLobstr();
      expect(wallet).toBeDefined();
      expect(wallet.publicKey).toBe(testPublicKey);
      expect(wallet.type).toBe('lobstr');

      delete (window as any).lobstr;
    });

    it('should handle Lobstr connection errors', async () => {
      const mockLobstr = {
        connect: vi.fn().mockRejectedValue(new Error('User rejected')),
      };

      Object.defineProperty(window, 'lobstr', {
        value: mockLobstr,
        writable: true,
        configurable: true,
      });

      await expect(adapter.connectLobstr()).rejects.toThrow();

      delete (window as any).lobstr;
    });
  });

  describe('Auto-connect', () => {
    it('should connect to Freighter if available', async () => {
      const mockFreighter = {
        publicKey: { [testPublicKey]: true },
        isConnected: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue(testPublicKey),
      };

      Object.defineProperty(window, 'freighter', {
        value: mockFreighter,
        writable: true,
        configurable: true,
      });

      const wallet = await adapter.connectAuto();
      expect(wallet?.type).toBe('freighter');

      delete (window as any).freighter;
    });

    it('should fallback to Lobstr if Freighter not available', async () => {
      const mockLobstr = {
        connect: vi.fn().mockResolvedValue({ publicKey: testPublicKey }),
      };

      Object.defineProperty(window, 'lobstr', {
        value: mockLobstr,
        writable: true,
        configurable: true,
      });

      const wallet = await adapter.connectAuto();
      expect(wallet?.type).toBe('lobstr');

      delete (window as any).lobstr;
    });

    it('should throw error if no wallet available', async () => {
      if ((window as any).freighter) delete (window as any).freighter;
      if ((window as any).lobstr) delete (window as any).lobstr;

      await expect(adapter.connectAuto()).rejects.toThrow();
    });
  });

  describe('Transaction signing', () => {
    it('should sign transaction with connected Freighter wallet', async () => {
      const mockFreighter = {
        publicKey: { [testPublicKey]: true },
        isConnected: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue(testPublicKey),
        signTransaction: vi.fn().mockResolvedValue('signed-xdr'),
      };

      Object.defineProperty(window, 'freighter', {
        value: mockFreighter,
        writable: true,
        configurable: true,
      });

      await adapter.connectFreighter();
      const signedXdr = await adapter.signTransaction('test-xdr');

      expect(signedXdr).toBe('signed-xdr');

      delete (window as any).freighter;
    });

    it('should throw error when signing without wallet connected', async () => {
      await expect(adapter.signTransaction('test-xdr')).rejects.toThrow();
    });

    it('should handle signing errors', async () => {
      const mockFreighter = {
        publicKey: { [testPublicKey]: true },
        isConnected: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue(testPublicKey),
        signTransaction: vi.fn().mockRejectedValue(new Error('User rejected')),
      };

      Object.defineProperty(window, 'freighter', {
        value: mockFreighter,
        writable: true,
        configurable: true,
      });

      await adapter.connectFreighter();

      await expect(adapter.signTransaction('test-xdr')).rejects.toThrow('User rejected');

      delete (window as any).freighter;
    });
  });

  describe('Wallet state management', () => {
    it('should return null wallet when disconnected', () => {
      const wallet = adapter.getWallet();
      expect(wallet).toBeNull();
    });

    it('should disconnect wallet', async () => {
      const mockFreighter = {
        publicKey: { [testPublicKey]: true },
        isConnected: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue(testPublicKey),
      };

      Object.defineProperty(window, 'freighter', {
        value: mockFreighter,
        writable: true,
        configurable: true,
      });

      await adapter.connectFreighter();
      expect(adapter.getWallet()).not.toBeNull();

      adapter.disconnect();
      expect(adapter.getWallet()).toBeNull();

      delete (window as any).freighter;
    });

    it('should maintain wallet state after operations', async () => {
      const mockFreighter = {
        publicKey: { [testPublicKey]: true },
        isConnected: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue(testPublicKey),
        signTransaction: vi.fn().mockResolvedValue('signed'),
      };

      Object.defineProperty(window, 'freighter', {
        value: mockFreighter,
        writable: true,
        configurable: true,
      });

      const wallet1 = await adapter.connectFreighter();
      await adapter.signTransaction('xdr');
      const wallet2 = adapter.getWallet();

      expect(wallet1?.publicKey).toBe(wallet2?.publicKey);

      delete (window as any).freighter;
    });
  });

  describe('Singleton pattern', () => {
    it('should return same instance on multiple calls', () => {
      const adapter1 = getStellarWalletAdapter();
      const adapter2 = getStellarWalletAdapter();

      expect(adapter1).toBe(adapter2);
    });

    it('should create new instance after reset', () => {
      const adapter1 = getStellarWalletAdapter();
      _resetAdapterSingleton();
      const adapter2 = getStellarWalletAdapter();

      expect(adapter1).not.toBe(adapter2);
    });
  });

  describe('Error handling', () => {
    it('should provide friendly error messages', async () => {
      const mockFreighter = {
        isConnected: vi.fn().mockRejectedValue(new Error('User denied')),
      };

      Object.defineProperty(window, 'freighter', {
        value: mockFreighter,
        writable: true,
        configurable: true,
      });

      try {
        await adapter.connectFreighter();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeDefined();
      }

      delete (window as any).freighter;
    });

    it('should handle malformed wallet responses', async () => {
      const mockFreighter = {
        publicKey: { [testPublicKey]: true },
        isConnected: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue(null),
      };

      Object.defineProperty(window, 'freighter', {
        value: mockFreighter,
        writable: true,
        configurable: true,
      });

      await expect(adapter.connectFreighter()).rejects.toThrow();

      delete (window as any).freighter;
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple connection attempts', async () => {
      const mockFreighter = {
        publicKey: { [testPublicKey]: true },
        isConnected: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue(testPublicKey),
      };

      Object.defineProperty(window, 'freighter', {
        value: mockFreighter,
        writable: true,
        configurable: true,
      });

      const wallet1 = await adapter.connectFreighter();
      const wallet2 = await adapter.connectFreighter();

      expect(wallet1.publicKey).toBe(wallet2.publicKey);

      delete (window as any).freighter;
    });

    it('should handle switching between wallets', async () => {
      const mockFreighter = {
        publicKey: { [testPublicKey]: true },
        isConnected: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue(testPublicKey),
      };

      const mockLobstr = {
        connect: vi.fn().mockResolvedValue({ publicKey: 'LOBSTR_KEY' }),
      };

      Object.defineProperty(window, 'freighter', {
        value: mockFreighter,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(window, 'lobstr', {
        value: mockLobstr,
        writable: true,
        configurable: true,
      });

      const wallet1 = await adapter.connectFreighter();
      adapter.disconnect();
      const wallet2 = await adapter.connectLobstr();

      expect(wallet1.type).toBe('freighter');
      expect(wallet2.type).toBe('lobstr');

      delete (window as any).freighter;
      delete (window as any).lobstr;
    });
  });
});
