'use client';

import { useState, useCallback } from 'react';

/**
 * Wallet state for the dashboard. The connection is mocked until Freighter or Lobstr is wired in.
 */
export function useDashboardWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>();
  const [resetKey, setResetKey] = useState(0);

  const handleConnect = useCallback(() => {
    setIsConnecting(true);
    // Mock wallet connection
    setTimeout(() => {
      setIsConnected(true);
      setWalletAddress('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
      setIsConnecting(false);
    }, 1000);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setWalletAddress(undefined);
    setResetKey((prev) => prev + 1);
  }, []);

  return { isConnected, isConnecting, walletAddress, resetKey, handleConnect, handleDisconnect };
}
