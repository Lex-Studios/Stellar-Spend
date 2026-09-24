import { describe, it, expect } from 'vitest';
import * as walletBarrel from '../index';

describe('Wallet Feature: Public API Boundary', () => {
  describe('Public API exports', () => {
    it('should export WalletModal component', () => {
      expect(walletBarrel).toHaveProperty('WalletModal');
      expect(typeof walletBarrel.WalletModal).toBe('object');
    });

    it('should export useStellarWallet hook', () => {
      expect(walletBarrel).toHaveProperty('useStellarWallet');
      expect(typeof walletBarrel.useStellarWallet).toBe('function');
    });

    it('should export useWalletFlow hook', () => {
      expect(walletBarrel).toHaveProperty('useWalletFlow');
      expect(typeof walletBarrel.useWalletFlow).toBe('function');
    });

    it('should export useWalletTransactions hook', () => {
      expect(walletBarrel).toHaveProperty('useWalletTransactions');
      expect(typeof walletBarrel.useWalletTransactions).toBe('function');
    });

    it('should export WalletProvider context', () => {
      expect(walletBarrel).toHaveProperty('WalletProvider');
      expect(typeof walletBarrel.WalletProvider).toBe('object');
    });

    it('should export useWalletContext hook', () => {
      expect(walletBarrel).toHaveProperty('useWalletContext');
      expect(typeof walletBarrel.useWalletContext).toBe('function');
    });

    it('should export WalletModalHeader component', () => {
      expect(walletBarrel).toHaveProperty('WalletModalHeader');
    });

    it('should export WalletModalError component', () => {
      expect(walletBarrel).toHaveProperty('WalletModalError');
    });

    it('should export WalletOptionButton component', () => {
      expect(walletBarrel).toHaveProperty('WalletOptionButton');
    });

    it('should export WALLET_OPTIONS constant', () => {
      expect(walletBarrel).toHaveProperty('WALLET_OPTIONS');
      expect(Array.isArray(walletBarrel.WALLET_OPTIONS)).toBe(true);
    });

    it('should export WalletModalProps type', () => {
      expect(walletBarrel).toHaveProperty('WalletModalProps');
    });

    it('should export WalletOption type', () => {
      expect(walletBarrel).toHaveProperty('WalletOption');
    });

    it('should export WalletContextValue type', () => {
      expect(walletBarrel).toHaveProperty('WalletContextValue');
    });

    it('should export WalletState type', () => {
      expect(walletBarrel).toHaveProperty('WalletState');
    });

    it('should export WalletSettings type', () => {
      expect(walletBarrel).toHaveProperty('WalletSettings');
    });

    it('should export WalletTransactions type', () => {
      expect(walletBarrel).toHaveProperty('WalletTransactions');
    });
  });

  describe('Public API completeness', () => {
    it('should provide all necessary components through barrel', () => {
      const componentExports = [
        'WalletModal',
        'WalletModalHeader',
        'WalletModalError',
        'WalletOptionButton',
      ];

      componentExports.forEach((exportName) => {
        expect(walletBarrel).toHaveProperty(exportName);
      });
    });

    it('should provide all necessary hooks through barrel', () => {
      const hookExports = ['useStellarWallet', 'useWalletFlow', 'useWalletTransactions'];

      hookExports.forEach((exportName) => {
        expect(walletBarrel).toHaveProperty(exportName);
      });
    });

    it('should provide all necessary types through barrel', () => {
      const typeExports = [
        'WalletModalProps',
        'WalletOption',
        'WalletContextValue',
        'WalletState',
        'WalletSettings',
        'WalletTransactions',
      ];

      typeExports.forEach((exportName) => {
        expect(walletBarrel).toHaveProperty(exportName);
      });
    });
  });

  describe('Public API usage patterns', () => {
    it('should enforce barrel import pattern in documentation', () => {
      const barrelPath = require.resolve('../index.ts');
      expect(barrelPath).toContain('features/wallet/index.ts');
    });

    it('should have WalletModal as the primary export', () => {
      expect(walletBarrel.WalletModal).toBeDefined();
    });

    it('should have useStellarWallet as primary hook export', () => {
      expect(walletBarrel.useStellarWallet).toBeDefined();
      expect(typeof walletBarrel.useStellarWallet).toBe('function');
    });

    it('should provide context management exports', () => {
      expect(walletBarrel.WalletProvider).toBeDefined();
      expect(walletBarrel.useWalletContext).toBeDefined();
      expect(walletBarrel.WalletContextValue).toBeDefined();
    });
  });

  describe('Type exports validation', () => {
    it('should have type exports available', () => {
      const exports = Object.keys(walletBarrel);

      // All types should be present
      expect(exports).toContain('WalletModalProps');
      expect(exports).toContain('WalletOption');
      expect(exports).toContain('WalletContextValue');
    });

    it('should provide WalletState and WalletSettings types', () => {
      expect(walletBarrel.WalletState).toBeDefined();
      expect(walletBarrel.WalletSettings).toBeDefined();
    });

    it('should provide WalletTransactions type for hook', () => {
      expect(walletBarrel.WalletTransactions).toBeDefined();
    });
  });

  describe('Barrel re-export integrity', () => {
    it('should not expose internal implementation details', () => {
      const exports = Object.keys(walletBarrel);

      // Should not expose internal paths
      expect(exports.filter((key) => key.includes('Internal')).length).toBe(0);
      expect(exports.filter((key) => key.includes('private')).length).toBe(0);
    });

    it('should export at reasonable scope', () => {
      const exports = Object.keys(walletBarrel);

      // Should have reasonable number of public exports
      expect(exports.length).toBeGreaterThanOrEqual(10);
      expect(exports.length).toBeLessThan(50);
    });

    it('should maintain consistent naming conventions', () => {
      const componentExports = ['WalletModal', 'WalletModalHeader', 'WalletModalError', 'WalletOptionButton'];

      componentExports.forEach((name) => {
        expect(name).toMatch(/^[A-Z]/);
      });
    });
  });

  describe('Feature stability', () => {
    it('should have stable public API', () => {
      const exports = Object.keys(walletBarrel);
      expect(exports).toContain('WalletModal');
      expect(exports).toContain('useStellarWallet');
    });

    it('should not break existing imports through barrel', () => {
      expect(() => {
        const { WalletModal, useStellarWallet, WalletProvider } = walletBarrel;
        expect(WalletModal).toBeDefined();
        expect(useStellarWallet).toBeDefined();
        expect(WalletProvider).toBeDefined();
      }).not.toThrow();
    });
  });
});
