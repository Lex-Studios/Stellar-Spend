import { createValidationError, createValidationResult, type ValidationResult } from './types';

export function validateAddress(address: string, chain: 'stellar' | 'base'): ValidationResult {
  if (!address || address.trim() === '') {
    return createValidationResult(false, [
      createValidationError('address', `${chain} address is required`),
    ]);
  }

  if (chain === 'stellar') {
    if (!/^G[A-Z0-9]{55}$/.test(address)) {
      return createValidationResult(false, [
        createValidationError('address', 'Invalid Stellar address format'),
      ]);
    }
  } else if (chain === 'base') {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return createValidationResult(false, [
        createValidationError('address', 'Invalid Base address format'),
      ]);
    }
  }

  return createValidationResult(true);
}

export function validateEvmAddress(address: string): ValidationResult {
  if (!address || address.trim() === '') {
    return createValidationResult(false, [
      createValidationError('address', 'EVM address is required'),
    ]);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return createValidationResult(false, [
      createValidationError('address', 'Invalid EVM address format'),
    ]);
  }

  return createValidationResult(true);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[^\w\s.-]/g, '');
}
