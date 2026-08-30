'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface WalletContextValue {
  /** Whether the wallet is currently connected */
  isConnected: boolean;
  /** Whether a connection attempt is in progress */
  isConnecting: boolean;
  /** The connected wallet address, if any */
  walletAddress?: string;
  /** The type of connected wallet */
  walletType?: 'Freighter' | 'Lobstr' | null;
  /** Trigger a wallet connection flow */
  onConnect: () => void;
  /** Disconnect the wallet */
  onDisconnect: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: WalletContextValue;
}) {
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

/**
 * Access wallet connection state without prop drilling.
 * Must be used within a <WalletProvider>.
 *
 * Use this hook in deeply-nested dashboard widgets to avoid threading
 * isConnected / isConnecting / onConnect through 3+ layers of props.
 */
export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWalletContext must be used within a <WalletProvider>');
  }
  return ctx;
}
