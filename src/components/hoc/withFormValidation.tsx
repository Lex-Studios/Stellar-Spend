import React, { ComponentType, useState, useCallback } from "react";
import { ValidationService } from "@/lib/validators";
import type { FormattedValidationError } from "@/lib/validators";

export interface WithFormValidationProps {
  errors: Record<string, string>;
  validate: (data: Record<string, any>) => boolean;
  clearErrors: () => void;
  setFieldError: (field: string, error: string) => void;
}

/**
 * HOC for adding form validation to components
 * Provides validation state and methods
 */
export function withFormValidation<P extends WithFormValidationProps>(
  Component: ComponentType<P>,
  validationFn: (data: Record<string, any>) => FormattedValidationError[],
) {
  return function ValidatedComponent(
    props: Omit<P, keyof WithFormValidationProps>,
  ) {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = useCallback((data: Record<string, any>) => {
      const validationErrors = validationFn(data);
      const errorMap = validationErrors.reduce(
        (acc, err) => {
          acc[err.field] = err.message;
          return acc;
        },
        {} as Record<string, string>,
      );
      setErrors(errorMap);
      return validationErrors.length === 0;
    }, []);

    const clearErrors = useCallback(() => {
      setErrors({});
    }, []);

    const setFieldError = useCallback((field: string, error: string) => {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }, []);

    return (
      <Component
        {...(props as P)}
        errors={errors}
        validate={validate}
        clearErrors={clearErrors}
        setFieldError={setFieldError}
      />
    );
  };
}

/**
 * Hook for form validation
 */
export function useFormValidation(
  validationFn: (data: Record<string, any>) => FormattedValidationError[],
) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((data: Record<string, any>) => {
    const validationErrors = validationFn(data);
    const errorMap = validationErrors.reduce(
      (acc, err) => {
        acc[err.field] = err.message;
        return acc;
      },
      {} as Record<string, string>,
    );
    setErrors(errorMap);
    return validationErrors.length === 0;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  return { errors, validate, clearErrors, setFieldError };
}
