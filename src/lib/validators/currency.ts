import { createValidationError, createValidationResult, type ValidationResult } from './types';

const SUPPORTED_CURRENCIES = ['NGN', 'KES', 'GHS', 'UGX', 'ZAR', 'GBP', 'USD', 'EUR'];

export function validateCurrency(currency: string): ValidationResult {
  if (!currency || currency.trim() === '') {
    return createValidationResult(false, [
      createValidationError('currency', 'Currency is required'),
    ]);
  }

  const upperCurrency = currency.toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(upperCurrency)) {
    return createValidationResult(false, [
      createValidationError('currency', `Currency ${currency} is not supported`),
    ]);
  }

  return createValidationResult(true);
}

export function validateToken(token: string): ValidationResult {
  if (!token || token.trim() === '') {
    return createValidationResult(false, [
      createValidationError('token', 'Token is required'),
    ]);
  }

  const upperToken = token.toUpperCase();
  if (!['USDC', 'USDT'].includes(upperToken)) {
    return createValidationResult(false, [
      createValidationError('token', `Token ${token} is not supported`),
    ]);
  }

  return createValidationResult(true);
}

export function getSupportedCurrencies(): string[] {
  return [...SUPPORTED_CURRENCIES];
}
