/**
 * Priority queue for transaction processing.
 * Higher priority = processed first.
 */

export enum TransactionPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4,
}

export interface QueuedTransaction {
  id: string;
  priority: TransactionPriority;
  amount: string; // USDC amount
  currency: string;
  feeMethod: 'stablecoin' | 'native';
  payload: Record<string, unknown>;
  enqueuedAt: number;
  attempts: number;
}

export interface PriorityFeeMultiplier {
  [TransactionPriority.LOW]: number;
  [TransactionPriority.NORMAL]: number;
  [TransactionPriority.HIGH]: number;
  [TransactionPriority.URGENT]: number;
}

// Fee multipliers per priority level
const FEE_MULTIPLIERS: PriorityFeeMultiplier = {
  [TransactionPriority.LOW]: 0.8,
  [TransactionPriority.NORMAL]: 1.0,
  [TransactionPriority.HIGH]: 1.2,
  [TransactionPriority.URGENT]: 1.5,
};

export interface QueueMetrics {
  totalEnqueued: number;
  totalProcessed: number;
  totalFailed: number;
  queueDepth: number;
  avgWaitMs: number;
  byPriority: Record<TransactionPriority, number>;
}

export class TransactionPriorityQueue {
  private heap: QueuedTransaction[] = [];
  private metrics: QueueMetrics = {
    totalEnqueued: 0,
    totalProcessed: 0,
    totalFailed: 0,
    queueDepth: 0,
    avgWaitMs: 0,
    byPriority: {
      [TransactionPriority.LOW]: 0,
      [TransactionPriority.NORMAL]: 0,
      [TransactionPriority.HIGH]: 0,
      [TransactionPriority.URGENT]: 0,
    },
  };
  private waitTimes: number[] = [];

  enqueue(tx: Omit<QueuedTransaction, 'enqueuedAt' | 'attempts'>): void {
    const item: QueuedTransaction = { ...tx, enqueuedAt: Date.now(), attempts: 0 };
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
    this.metrics.totalEnqueued++;
    this.metrics.queueDepth = this.heap.length;
    this.metrics.byPriority[tx.priority]++;
  }

  dequeue(): QueuedTransaction | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    this.metrics.totalProcessed++;
    this.metrics.queueDepth = this.heap.length;
    const waitMs = Date.now() - top.enqueuedAt;
    this.waitTimes.push(waitMs);
    if (this.waitTimes.length > 100) this.waitTimes.shift();
    this.metrics.avgWaitMs =
      this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length;
    return top;
  }

  peek(): QueuedTransaction | undefined {
    return this.heap[0];
  }

  size(): number {
    return this.heap.length;
  }

  getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }

  recordFailure(): void {
    this.metrics.totalFailed++;
  }

  private compare(a: QueuedTransaction, b: QueuedTransaction): boolean {
    if (a.priority !== b.priority) return a.priority > b.priority;
    // FIFO within same priority
    return a.enqueuedAt < b.enqueuedAt;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.compare(this.heap[i], this.heap[parent])) {
        [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
        i = parent;
      } else break;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let largest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.compare(this.heap[l], this.heap[largest])) largest = l;
      if (r < n && this.compare(this.heap[r], this.heap[largest])) largest = r;
      if (largest === i) break;
      [this.heap[i], this.heap[largest]] = [this.heap[largest], this.heap[i]];
      i = largest;
    }
  }
}

/**
 * Calculate the priority-adjusted fee for a transaction.
 */
export function calculatePriorityFee(baseFee: string, priority: TransactionPriority): string {
  const base = parseFloat(baseFee);
  if (isNaN(base)) return baseFee;
  const adjusted = base * FEE_MULTIPLIERS[priority];
  return adjusted.toFixed(6);
}

/**
 * Determine priority from amount (larger amounts get higher priority).
 */
export function inferPriorityFromAmount(amountUsdc: string): TransactionPriority {
  const amount = parseFloat(amountUsdc);
  if (isNaN(amount)) return TransactionPriority.NORMAL;
  if (amount >= 10000) return TransactionPriority.URGENT;
  if (amount >= 1000) return TransactionPriority.HIGH;
  if (amount >= 100) return TransactionPriority.NORMAL;
  return TransactionPriority.LOW;
}

// Singleton queue instance for the server process
let _queue: TransactionPriorityQueue | null = null;

export function getTransactionQueue(): TransactionPriorityQueue {
  if (!_queue) _queue = new TransactionPriorityQueue();
  return _queue;
}
