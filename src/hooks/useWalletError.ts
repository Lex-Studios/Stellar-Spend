import { useCallback, useState } from 'react';

export interface WalletErrorState {
  error: Error | null;
  setError: (error: Error | null) => void;
  clearError: () => void;
  retry: () => void;
  canRetry: boolean;
}

/**
 * Single-purpose hook that owns wallet error state and retry handling.
 * Extracted from `useWalletFlow` so error/retry logic can be tested and
 * reused independently of connection or signing concerns.
 */
export function useWalletError(onRetry?: () => void): WalletErrorState {
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(() => {
    setError(null);
    onRetry?.();
  }, [onRetry]);

  return {
    error,
    setError,
    clearError,
    retry,
    canRetry: Boolean(onRetry),
  };
}

export default useWalletError;
