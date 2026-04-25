import { describe, it, expect } from 'vitest';
import {
  calculateBridgeFee,
  calculateNetworkFee,
  calculatePaycrestFee,
  calculateTotalFees,
  calculateAmountAfterFees,
  calculateAllFees,
  getDetailedFeeBreakdown,
} from '@/lib/fee-calculation';

describe('calculateBridgeFee', () => {
  it('returns 0 for native fee method', () => {
    expect(calculateBridgeFee('100', 'native')).toBe('0');
  });

  it('calculates 0.5% fee for stablecoin method', () => {
    expect(calculateBridgeFee('100', 'stablecoin')).toBe('0.500000');
  });

  it('calculates fee for large amount', () => {
    expect(calculateBridgeFee('1000', 'stablecoin')).toBe('5.000000');
  });

  it('throws for zero amount', () => {
    expect(() => calculateBridgeFee('0', 'stablecoin')).toThrow('Invalid amount');
  });

  it('throws for negative amount', () => {
    expect(() => calculateBridgeFee('-50', 'stablecoin')).toThrow('Invalid amount');
  });

  it('throws for non-numeric string', () => {
    expect(() => calculateBridgeFee('abc', 'stablecoin')).toThrow('Invalid amount');
  });
});

describe('calculateNetworkFee', () => {
  it('returns 0 for stablecoin method', () => {
    expect(calculateNetworkFee('stablecoin')).toBe('0');
  });

  it('returns XLM base fee for native method', () => {
    expect(calculateNetworkFee('native')).toBe('0.00001');
  });
});

describe('calculatePaycrestFee', () => {
  it('calculates 1% fee on receive amount', () => {
    expect(calculatePaycrestFee('100')).toBe('1.00');
  });

  it('calculates fee for large receive amount', () => {
    expect(calculatePaycrestFee('158202')).toBe('1582.02');
  });

  it('returns 0 for zero amount', () => {
    expect(calculatePaycrestFee('0')).toBe('0');
  });

  it('returns 0 for negative amount', () => {
    expect(calculatePaycrestFee('-100')).toBe('0');
  });

  it('returns 0 for non-numeric string', () => {
    expect(calculatePaycrestFee('abc')).toBe('0');
  });
});

describe('calculateTotalFees', () => {
  it('sums all fee components', () => {
    const total = calculateTotalFees('0.5', '0', '1.58', 'NGN');
    expect(parseFloat(total)).toBeCloseTo(2.08, 5);
  });

  it('handles zero fees', () => {
    expect(calculateTotalFees('0', '0', '0', 'NGN')).toBe('0.000000');
  });

  it('handles native fee method (XLM network fee)', () => {
    const total = calculateTotalFees('0', '0.00001', '1.00', 'NGN');
    expect(parseFloat(total)).toBeCloseTo(1.00001, 5);
  });
});

describe('calculateAmountAfterFees', () => {
  it('subtracts fee from amount', () => {
    expect(calculateAmountAfterFees('100', '0.5')).toBe('99.500000');
  });

  it('returns 0 when fee exceeds amount', () => {
    expect(calculateAmountAfterFees('0.1', '1')).toBe('0');
  });

  it('throws for non-numeric amount', () => {
    expect(() => calculateAmountAfterFees('abc', '1')).toThrow('Invalid amounts');
  });

  it('throws for non-numeric fee', () => {
    expect(() => calculateAmountAfterFees('100', 'abc')).toThrow('Invalid amounts');
  });
});

describe('calculateAllFees', () => {
  it('returns full fee breakdown for stablecoin method', async () => {
    const result = await calculateAllFees({
      amount: '100',
      currency: 'NGN',
      feeMethod: 'stablecoin',
      receiveAmount: '158202',
    });

    expect(result.bridgeFee).toBe('0.500000');
    expect(result.networkFee).toBe('0');
    expect(result.paycrestFee).toBe('1582.02');
    expect(result.amount).toBe('100');
    expect(result.currency).toBe('NGN');
    expect(parseFloat(result.amountAfterFees)).toBeCloseTo(99.5, 4);
  });

  it('returns full fee breakdown for native method', async () => {
    const result = await calculateAllFees({
      amount: '100',
      currency: 'NGN',
      feeMethod: 'native',
    });

    expect(result.bridgeFee).toBe('0');
    expect(result.networkFee).toBe('0.00001');
    expect(result.paycrestFee).toBe('0');
    expect(result.amountAfterFees).toBe('100.000000');
  });

  it('sets paycrestFee to 0 when receiveAmount is omitted', async () => {
    const result = await calculateAllFees({
      amount: '50',
      currency: 'KES',
      feeMethod: 'stablecoin',
    });
    expect(result.paycrestFee).toBe('0');
  });
});

describe('getDetailedFeeBreakdown', () => {
  it('includes breakdown object with bridge, network, and paycrest details', async () => {
    const result = await getDetailedFeeBreakdown({
      amount: '100',
      currency: 'NGN',
      feeMethod: 'stablecoin',
      receiveAmount: '100',
    });

    expect(result.breakdown.bridge.percentage).toBe('0.5%');
    expect(result.breakdown.network.fee).toBe('0');
    expect(result.breakdown.paycrest.percentage).toBe('1%');
  });

  it('shows 0% bridge percentage for native method', async () => {
    const result = await getDetailedFeeBreakdown({
      amount: '100',
      currency: 'NGN',
      feeMethod: 'native',
    });

    expect(result.breakdown.bridge.percentage).toBe('0%');
    expect(result.breakdown.network.fee).toBe('0.00001');
  });
});
