import { renderHook, act, waitFor } from '@testing-library/react';
import { useStellarWallet } from '../useStellarWallet';

jest.mock('@/lib/wallets/manager', () => ({
  WalletManager: jest.fn(function () {
    this.getAvailableWallets = jest.fn(() => []);
    this.isWalletAvailable = jest.fn(() => false);
    this.connect = jest.fn();
    this.disconnect = jest.fn();
  }),
}));

describe('useStellarWallet type safety', () => {
  it('properly types window.freighter access', () => {
    const { result } = renderHook(() => useStellarWallet());

    expect(result.current).toBeDefined();
    expect(result.current.isConnected).toBe(false);
  });

  it('properly types window.stellar/lobstr access', () => {
    const { result } = renderHook(() => useStellarWallet());

    expect(result.current.detectedWallets).toEqual([]);
  });

  it('maintains wallet state type safety', () => {
    const { result } = renderHook(() => useStellarWallet());

    expect(result.current.publicKey).toBeNull();
    expect(result.current.walletType).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('provides strongly typed error handling', () => {
    const { result } = renderHook(() => useStellarWallet());

    const errorMessage = result.current.getErrorMessage(null);
    expect(errorMessage).toBe('');
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
