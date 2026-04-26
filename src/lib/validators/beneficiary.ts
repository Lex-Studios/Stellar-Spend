import { createValidationError, createValidationResult, type ValidationResult } from './types';

export interface BeneficiaryData {
  institution: string;
  accountIdentifier: string;
  accountName?: string;
  currency: string;
}

export function validateBeneficiary(data: BeneficiaryData): ValidationResult {
  const errors = [];

  if (!data.institution || data.institution.trim() === '') {
    errors.push(createValidationError('institution', 'Institution is required'));
  }

  if (!data.accountIdentifier || data.accountIdentifier.trim() === '') {
    errors.push(createValidationError('accountIdentifier', 'Account identifier is required'));
  } else if (!/^\d{10}$/.test(data.accountIdentifier.trim())) {
    errors.push(createValidationError('accountIdentifier', 'Account identifier must be 10 digits'));
  }

  if (!data.currency || data.currency.trim() === '') {
    errors.push(createValidationError('currency', 'Currency is required'));
  }

  return createValidationResult(errors.length === 0, errors);
}

export function validateAccountNumber(accountNumber: string): ValidationResult {
  if (!accountNumber || accountNumber.trim() === '') {
    return createValidationResult(false, [
      createValidationError('accountNumber', 'Account number is required'),
    ]);
  }

  if (!/^\d{10}$/.test(accountNumber.trim())) {
    return createValidationResult(false, [
      createValidationError('accountNumber', 'Account number must be 10 digits'),
    ]);
  }

  return createValidationResult(true);
}

export function validateInstitution(institution: string): ValidationResult {
  if (!institution || institution.trim() === '') {
    return createValidationResult(false, [
      createValidationError('institution', 'Institution is required'),
    ]);
  }

  return createValidationResult(true);
}
