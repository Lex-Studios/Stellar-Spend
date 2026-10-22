'use client';

import { useCallback, type RefObject } from 'react';
import type { WalletManager } from '@/lib/wallets';

/**
 * Signs a transaction XDR with the connected wallet's adapter, for the passphrase this app runs on.
 * Throws if no wallet manager is ready yet.
 */
export function useTransactionSigning(
  managerRef: RefObject<WalletManager | null>,
  networkPassphrase: string,
) {
  return useCallback(
    async (xdr: string): Promise<string> => {
      if (!managerRef.current) {
        throw new Error('Wallet manager is not ready. Please try again.');
      }
      return managerRef.current.signTransaction(xdr, { networkPassphrase });
    },
    [managerRef, networkPassphrase],
  );
}
