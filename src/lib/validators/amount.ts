import { createValidationError, createValidationResult, type ValidationResult } from './types';

export function validateAmount(amount: string): ValidationResult {
  const errors = [];

  if (!amount || amount.trim() === '') {
    errors.push(createValidationError('amount', 'Amount is required'));
    return createValidationResult(false, errors);
  }

  if (!/^\d*\.?\d*$/.test(amount.trim())) {
    errors.push(createValidationError('amount', 'Amount must be a valid number'));
    return createValidationResult(false, errors);
  }

  if (amount.trim() === '.') {
    errors.push(createValidationError('amount', 'Amount must be a valid number'));
    return createValidationResult(false, errors);
  }

  const num = parseFloat(amount);
  if (isNaN(num) || !isFinite(num)) {
    errors.push(createValidationError('amount', 'Amount must be a valid number'));
    return createValidationResult(false, errors);
  }

  if (num <= 0) {
    errors.push(createValidationError('amount', 'Amount must be greater than 0'));
    return createValidationResult(false, errors);
  }

  return createValidationResult(true);
}

export function validateMinAmount(amount: string, min: number): ValidationResult {
  const result = validateAmount(amount);
  if (!result.valid) return result;

  const num = parseFloat(amount);
  if (num < min) {
    return createValidationResult(false, [
      createValidationError('amount', `Amount must be at least ${min}`),
    ]);
  }

  return createValidationResult(true);
}

export function validateMaxAmount(amount: string, max: number): ValidationResult {
  const result = validateAmount(amount);
  if (!result.valid) return result;

  const num = parseFloat(amount);
  if (num > max) {
    return createValidationResult(false, [
      createValidationError('amount', `Amount cannot exceed ${max}`),
    ]);
  }

  return createValidationResult(true);
}

export function validateAmountRange(amount: string, min: number, max: number): ValidationResult {
  const minResult = validateMinAmount(amount, min);
  if (!minResult.valid) return minResult;

  return validateMaxAmount(amount, max);
}
