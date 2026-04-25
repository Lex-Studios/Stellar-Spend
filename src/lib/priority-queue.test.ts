import { describe, it, expect, beforeEach } from 'vitest';
import {
  TransactionPriorityQueue,
  TransactionPriority,
  calculatePriorityFee,
  inferPriorityFromAmount,
} from './priority-queue';

describe('TransactionPriorityQueue', () => {
  let queue: TransactionPriorityQueue;

  beforeEach(() => {
    queue = new TransactionPriorityQueue();
  });

  it('dequeues in priority order', () => {
    queue.enqueue({ id: '1', priority: TransactionPriority.LOW, amount: '10', currency: 'NGN', feeMethod: 'stablecoin', payload: {} });
    queue.enqueue({ id: '2', priority: TransactionPriority.URGENT, amount: '10', currency: 'NGN', feeMethod: 'stablecoin', payload: {} });
    queue.enqueue({ id: '3', priority: TransactionPriority.NORMAL, amount: '10', currency: 'NGN', feeMethod: 'stablecoin', payload: {} });

    expect(queue.dequeue()?.id).toBe('2');
    expect(queue.dequeue()?.id).toBe('3');
    expect(queue.dequeue()?.id).toBe('1');
  });

  it('is FIFO within same priority', () => {
    queue.enqueue({ id: 'a', priority: TransactionPriority.HIGH, amount: '10', currency: 'NGN', feeMethod: 'stablecoin', payload: {} });
    queue.enqueue({ id: 'b', priority: TransactionPriority.HIGH, amount: '10', currency: 'NGN', feeMethod: 'stablecoin', payload: {} });

    expect(queue.dequeue()?.id).toBe('a');
    expect(queue.dequeue()?.id).toBe('b');
  });

  it('returns undefined when empty', () => {
    expect(queue.dequeue()).toBeUndefined();
  });

  it('tracks metrics', () => {
    queue.enqueue({ id: '1', priority: TransactionPriority.NORMAL, amount: '10', currency: 'NGN', feeMethod: 'stablecoin', payload: {} });
    queue.dequeue();
    const m = queue.getMetrics();
    expect(m.totalEnqueued).toBe(1);
    expect(m.totalProcessed).toBe(1);
    expect(m.queueDepth).toBe(0);
  });
});

describe('calculatePriorityFee', () => {
  it('applies LOW multiplier (0.8x)', () => {
    expect(parseFloat(calculatePriorityFee('1.000000', TransactionPriority.LOW))).toBeCloseTo(0.8);
  });

  it('applies URGENT multiplier (1.5x)', () => {
    expect(parseFloat(calculatePriorityFee('1.000000', TransactionPriority.URGENT))).toBeCloseTo(1.5);
  });

  it('returns original on invalid input', () => {
    expect(calculatePriorityFee('invalid', TransactionPriority.NORMAL)).toBe('invalid');
  });
});

describe('inferPriorityFromAmount', () => {
  it('returns URGENT for >= 10000', () => {
    expect(inferPriorityFromAmount('10000')).toBe(TransactionPriority.URGENT);
  });

  it('returns HIGH for >= 1000', () => {
    expect(inferPriorityFromAmount('1500')).toBe(TransactionPriority.HIGH);
  });

  it('returns NORMAL for >= 100', () => {
    expect(inferPriorityFromAmount('500')).toBe(TransactionPriority.NORMAL);
  });

  it('returns LOW for < 100', () => {
    expect(inferPriorityFromAmount('50')).toBe(TransactionPriority.LOW);
  });
});
