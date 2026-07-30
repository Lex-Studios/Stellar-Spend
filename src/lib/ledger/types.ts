export type AccountType =
  "asset" | "liability" | "equity" | "revenue" | "expense";
export type EntryType = "debit" | "credit";
export type ReconciliationStatus =
  "unreconciled" | "reconciled" | "discrepancy";

export interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  category: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface LedgerEntry {
  id: string;
  transactionId?: string;
  accountId: string;
  entryType: EntryType;
  amount: string;
  currency: string;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  entryHash: string;
  createdAt: number;
}

export interface LedgerReconciliation {
  id: string;
  reportId: string;
  accountId: string;
  reportedBalance: string;
  ledgerBalance: string;
  difference: string;
  status: ReconciliationStatus;
  reconciledAt?: number;
  notes?: string;
  createdAt: number;
}

export interface RevenueSummary {
  totalRevenue: string;
  totalFees: string;
  totalPayoutFees: string;
  totalBridgeFees: string;
  byCurrency: Record<string, string>;
  byPeriod: { period: string; amount: string; count: number }[];
}
