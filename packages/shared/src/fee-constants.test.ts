import { describe, it, expect } from 'vitest';
import {
  FEE_CONSTANTS,
  calculateBasisPointsFee,
  percentageToBasisPoints,
  isValidBasisPoints,
} from './fee-constants';

describe('fee-constants', () => {
  it('exposes the documented fee percentages and basis points in sync', () => {
    expect(percentageToBasisPoints(FEE_CONSTANTS.STABLECOIN_FEE_PERCENTAGE)).toBe(
      FEE_CONSTANTS.STABLECOIN_FEE_BASIS_POINTS,
    );
    expect(percentageToBasisPoints(FEE_CONSTANTS.PAYCREST_FEE_PERCENTAGE)).toBe(
      FEE_CONSTANTS.PAYCREST_FEE_BASIS_POINTS,
    );
    expect(percentageToBasisPoints(FEE_CONSTANTS.MAX_FEE_PERCENTAGE)).toBe(
      FEE_CONSTANTS.MAX_FEE_BASIS_POINTS,
    );
  });

  it('calculates basis point fees for numeric and string amounts', () => {
    expect(calculateBasisPointsFee(1000, 50)).toBe(5);
    expect(calculateBasisPointsFee('1000', 100)).toBe(10);
  });

  it('validates basis points against the configured maximum', () => {
    expect(isValidBasisPoints(0)).toBe(true);
    expect(isValidBasisPoints(FEE_CONSTANTS.MAX_FEE_BASIS_POINTS)).toBe(true);
    expect(isValidBasisPoints(FEE_CONSTANTS.MAX_FEE_BASIS_POINTS + 1)).toBe(false);
    expect(isValidBasisPoints(-1)).toBe(false);
  });
});
