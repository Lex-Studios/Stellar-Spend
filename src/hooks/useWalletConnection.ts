import { useCallback, useEffect, useRef, useState } from 'react';

export type WalletConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface WalletConnectionState {
  status: WalletConnectionStatus;
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
}

export interface UseWalletConnectionOptions {
  /**
   * Optional connector used to establish a wallet connection. When omitted the
   * hook only tracks externally-driven connection state.
   */
  connect?: () => Promise<{ address: string; chainId?: number | null }>;
  /**
   * Optional connector used to tear down a wallet connection.
   */
  disconnect?: () => Promise<void> | void;
  /**
   * Optional initial state, useful when the wallet is already connected on
   * mount (e.g. restored from a previous session).
   */
  initialAddress?: string | null;
  initialChainId?: number | null;
}

export interface UseWalletConnectionResult extends WalletConnectionState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setConnected: (address: string, chainId?: number | null) => void;
  setDisconnected: () => void;
  setError: () => void;
}

/**
 * Single-purpose hook that owns wallet connection state only.
 *
 * It intentionally does not handle signing or error/retry concerns; those live
 * in their own hooks so each responsibility can be tested in isolation.
 */
export function useWalletConnection(
  options: UseWalletConnectionOptions = {},
): UseWalletConnectionResult {
  const { connect: connectFn, disconnect: disconnectFn } = options;

  const [status, setStatus] = useState<WalletConnectionStatus>(
    options.initialAddress ? 'connected' : 'idle',
  );
  const [address, setAddress] = useState<string | null>(
    options.initialAddress ?? null,
  );
  const [chainId, setChainId] = useState<number | null>(
    options.initialChainId ?? null,
  );

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setConnected = useCallback(
    (nextAddress: string, nextChainId: number | null = null) => {
      setAddress(nextAddress);
      setChainId(nextChainId);
      setStatus('connected');
    },
    [],
  );

  const setDisconnected = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setStatus('disconnected');
  }, []);

  const setError = useCallback(() => {
    setStatus('error');
  }, []);

  const connect = useCallback(async () => {
    if (!connectFn) {
      return;
    }
    setStatus('connecting');
    try {
      const result = await connectFn();
      if (!mountedRef.current) {
        return;
      }
      setConnected(result.address, result.chainId ?? null);
    } catch (error) {
      if (mountedRef.current) {
        setStatus('error');
      }
      throw error;
    }
  }, [connectFn, setConnected]);

  const disconnect = useCallback(async () => {
    if (disconnectFn) {
      await disconnectFn();
    }
    if (mountedRef.current) {
      setDisconnected();
    }
  }, [disconnectFn, setDisconnected]);

  return {
    status,
    address,
    chainId,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    connect,
    disconnect,
    setConnected,
    setDisconnected,
    setError,
  };
}

export default useWalletConnection;
