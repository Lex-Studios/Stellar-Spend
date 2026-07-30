import React, { ComponentType, useState, useCallback } from "react";

export interface WithErrorHandlingProps {
  error: Error | null;
  setError: (error: Error | null) => void;
  clearError: () => void;
  withErrorHandling: <T>(fn: () => Promise<T>) => Promise<T>;
}

/**
 * HOC for adding error handling to components
 */
export function withErrorHandling<P extends WithErrorHandlingProps>(
  Component: ComponentType<P>,
) {
  return function ErrorHandlingComponent(
    props: Omit<P, keyof WithErrorHandlingProps>,
  ) {
    const [error, setError] = useState<Error | null>(null);

    const clearError = useCallback(() => {
      setError(null);
    }, []);

    const withErrorHandling = useCallback(
      async <T,>(fn: () => Promise<T>): Promise<T> => {
        try {
          clearError();
          return await fn();
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          throw error;
        }
      },
      [clearError],
    );

    return (
      <Component
        {...(props as P)}
        error={error}
        setError={setError}
        clearError={clearError}
        withErrorHandling={withErrorHandling}
      />
    );
  };
}

/**
 * Hook for error handling
 */
export function useErrorHandling() {
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withErrorHandling = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      try {
        clearError();
        return await fn();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [clearError],
  );

  return { error, setError, clearError, withErrorHandling };
}
