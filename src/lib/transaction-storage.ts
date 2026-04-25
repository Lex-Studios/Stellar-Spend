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
  status: 'pending' | 'completed' | 'failed';
  error?: string;
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

  static generateId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
