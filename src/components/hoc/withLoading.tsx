import React, { ComponentType, useState, useCallback } from "react";

export interface WithLoadingProps {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

/**
 * HOC for adding loading state to components
 */
export function withLoading<P extends WithLoadingProps>(
  Component: ComponentType<P>,
) {
  return function LoadingComponent(props: Omit<P, keyof WithLoadingProps>) {
    const [isLoading, setLoading] = useState(false);

    const withLoading = useCallback(
      async <T,>(fn: () => Promise<T>): Promise<T> => {
        setLoading(true);
        try {
          return await fn();
        } finally {
          setLoading(false);
        }
      },
      [],
    );

    return (
      <Component
        {...(props as P)}
        isLoading={isLoading}
        setLoading={setLoading}
        withLoading={withLoading}
      />
    );
  };
}

/**
 * Hook for loading state
 */
export function useLoading() {
  const [isLoading, setLoading] = useState(false);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setLoading(true);
      try {
        return await fn();
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { isLoading, setLoading, withLoading };
}
