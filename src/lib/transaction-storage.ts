export interface Transaction {
  id: string;
  timestamp: number;
  finalizedAt?: number;
  userAddress: string;
  amount: string;
  currency: string;
  feeMethod?: 'native' | 'stablecoin';
  bridgeFee?: string;
  networkFee?: string;
  paycrestFee?: string;
  totalFee?: string;
  stellarTxHash?: string;
  bridgeStatus?: string;
  payoutOrderId?: string;
  payoutStatus?: string;
  beneficiary: {
    institution: string;
    accountIdentifier: string;
    accountName: string;
    currency: string;
  };
  status: 'pending' | 'completed' | 'failed' | 'reversed' | 'partially_reversed';
  error?: string;
  /** User-supplied note for this transaction (max 500 chars) */
  note?: string;
  /** Reversal information */
  reversal?: {
    id: string;
    timestamp: number;
    amount: string;
    reason: string;
    status: 'pending' | 'completed' | 'failed';
  };
}

const STORAGE_KEY = 'stellar_spend_transactions';
const MAX_TRANSACTIONS = 50;

export class TransactionStorage {
  static save(transaction: Transaction): void {
    if (typeof window === 'undefined') return;
    const all = this.getAll();
    all.unshift(transaction);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, MAX_TRANSACTIONS)));
  }

  static update(id: string, updates: Partial<Transaction>): void {
    if (typeof window === 'undefined') return;
    const all = this.getAll();
    const i = all.findIndex(tx => tx.id === id);
    if (i !== -1) {
      all[i] = { ...all[i], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
  }

  static getAll(): Transaction[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static getByUser(userAddress: string): Transaction[] {
    return this.getAll().filter(tx => tx.userAddress.toLowerCase() === userAddress.toLowerCase());
  }

  static getById(id: string): Transaction | undefined {
    return this.getAll().find(tx => tx.id === id);
  }

  static clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }

  static updateNote(id: string, note: string): void {
    this.update(id, { note: note.slice(0, 500) });
  }

  static generateId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static isReversalEligible(tx: Transaction): boolean {
    return tx.status === 'completed' && !tx.reversal;
  }

  static reverse(id: string, amount: string, reason: string): void {
    const tx = this.getById(id);
    if (!tx || !this.isReversalEligible(tx)) return;
    
    this.update(id, {
      reversal: {
        id: `rev_${Date.now()}`,
        timestamp: Date.now(),
        amount,
        reason,
        status: 'pending',
      },
      status: parseFloat(amount) === parseFloat(tx.amount) ? 'reversed' : 'partially_reversed',
    });
  }

  static updateReversalStatus(id: string, status: 'pending' | 'completed' | 'failed'): void {
    const tx = this.getById(id);
    if (!tx?.reversal) return;
    
    this.update(id, {
      reversal: { ...tx.reversal, status },
    });
  }
}
