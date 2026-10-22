'use client';

import { useMemo, useState, useCallback } from 'react';
import { buildProgressSteps, STATE_VARIANTS } from '@/data/stellaramp';
import type { WalletFlowState } from '@stellar-spend/shared';

/**
 * useWalletConnectionState
 *
 * Owns the connection-state machine for the wallet flow: the current
 * `WalletFlowState` plus the transition helpers used to move between
 * the pre-connect, connecting, and connected states.
 */
export function useWalletConnectionState(initialState: WalletFlowState = 'pre_connect') {
  const [state, setState] = useState<WalletFlowState>(initialState);

  // State transition helpers for cleaner consumption
  const setPreConnect = useCallback(() => setState('pre_connect'), []);
  const setConnecting = useCallback(() => setState('connecting'), []);
  const setConnected = useCallback(() => setState('connected'), []);

  return {
    state,
    setState,
    setPreConnect,
    setConnecting,
    setConnected,
  };
}

/**
 * useWalletFlowError
 *
 * Owns error/retry handling for the wallet flow. Tracks the last error
 * message and exposes helpers to record an error and to retry (clear the
 * error and re-run the supplied callback).
 */
export function useWalletFlowError() {
  const [error, setError] = useState<string | null>(null);

  const reportError = useCallback((message: string) => {
    setError(message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback((onRetry?: () => void) => {
    setError(null);
    onRetry?.();
  }, []);

  return {
    error,
    reportError,
    clearError,
    retry,
  };
}

/**
 * useWalletFlow
 *
 * Manages the UI-related state machine for the wallet connection flow.
 * Composes the connection-state and error/retry hooks and derives the
 * progress steps and UI variant data. The returned API is unchanged for
 * existing consumers.
 */
export function useWalletFlow(initialState: WalletFlowState = 'pre_connect') {
  const { state, setState, setPreConnect, setConnecting, setConnected } =
    useWalletConnectionState(initialState);
  const { error, reportError, clearError, retry } = useWalletFlowError();

  // Derive the UI variant based on the current state.
  // STATE_VARIANTS is a static lookup, so we can memoize it.
  const variant = useMemo(() => STATE_VARIANTS[state], [state]);

  // Derive and memoize the progress steps based on the variant.
  // This ensures steps only re-calculates when the variant (and thus the state) changes.
  const steps = useMemo(() => buildProgressSteps(variant), [variant]);

  return {
    state,
    setState,
    variant,
    steps,
    setPreConnect,
    setConnecting,
    setConnected,
    error,
    reportError,
    clearError,
    retry,
  };
}
