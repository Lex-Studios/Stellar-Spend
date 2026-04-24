"use client";

import { useEffect, useMemo, useState } from "react";
import type { Transaction } from "@/lib/transaction-storage";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { Header } from "@/components/Header";
import { CopyButton } from "@/components/CopyButton";
import { cn } from "@/lib/cn";
import { getCurrencyFlag } from "@/lib/currency-flags";
import { TransactionTableSkeleton } from "@/components/skeletons";
import ExportControls from "@/components/ExportControls";
import { StatusBadge } from "@/components/StatusBadge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function truncateTxHash(hash: string): string {
  if (!hash || hash.length <= 12) return hash || "—";
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
    KES: "KSh",
    GHS: "₵",
    ZAR: "R",
  };
  return symbols[currency.toUpperCase()] || currency.toUpperCase();
}

function StatusBadge({ status }: { status: Transaction["status"] }) {
  const styles = {
    pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    completed: "bg-green-500/20 text-green-500 border-green-500/30",
    failed: "bg-red-500/20 text-red-500 border-red-500/30",
  };
  return (
    <span
      className={cn(
        "inline-block px-2.5 py-0.5 text-[10px] tracking-widest uppercase font-semibold border",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

type SortField = "timestamp" | "amount";
type SortDir = "asc" | "desc";

interface Filters {
  search: string;
  status: Transaction["status"] | "all";
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  sortField: SortField;
  sortDir: SortDir;
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  status: "all",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
  sortField: "timestamp",
  sortDir: "desc",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HistoryPage() {
  const { wallet, isConnected, isConnecting, connect, disconnect } =
    useStellarWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet?.publicKey) {
      setTransactions([]);
      setError(null);
      return;
    }

    const address = wallet.publicKey;
    setIsLoading(true);
    setError(null);

    fetch(`/api/transactions?wallet=${encodeURIComponent(address)}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then(
            (body) => {
              throw new Error(body?.error ?? "Failed to load transactions");
            },
            () => {
              throw new Error("Failed to load transactions");
            },
          );
        }
        return res.json() as Promise<Transaction[]>;
      })
      .then((data) => {
        setTransactions(data);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Failed to load transactions",
        );
        setTransactions([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [wallet?.publicKey]);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const toggleSort = (field: SortField) =>
    setFilters((prev) => ({
      ...prev,
      sortField: field,
      sortDir:
        prev.sortField === field && prev.sortDir === "desc" ? "asc" : "desc",
    }));

  const filtered = useMemo(() => {
    let result = [...transactions];

    // Search by ID or tx hash
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (tx) =>
          tx.id.toLowerCase().includes(q) ||
          (tx.stellarTxHash?.toLowerCase().includes(q) ?? false),
      );
    }

    // Status filter
    if (filters.status !== "all") {
      result = result.filter((tx) => tx.status === filters.status);
    }

    // Date range
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      result = result.filter((tx) => tx.timestamp >= from);
    }
    if (filters.dateTo) {
      // include the full end day
      const to = new Date(filters.dateTo).getTime() + 86_400_000 - 1;
      result = result.filter((tx) => tx.timestamp <= to);
    }

    // Amount range
    if (filters.amountMin !== "") {
      const min = parseFloat(filters.amountMin);
      if (!isNaN(min))
        result = result.filter((tx) => parseFloat(tx.amount) >= min);
    }
    if (filters.amountMax !== "") {
      const max = parseFloat(filters.amountMax);
      if (!isNaN(max))
        result = result.filter((tx) => parseFloat(tx.amount) <= max);
    }

    // Sort
    result.sort((a, b) => {
      let diff = 0;
      if (filters.sortField === "timestamp") diff = a.timestamp - b.timestamp;
      else diff = parseFloat(a.amount) - parseFloat(b.amount);
      return filters.sortDir === "asc" ? diff : -diff;
    });

    return result;
  }, [transactions, filters]);

  const hasActiveFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.amountMin ||
    filters.amountMax;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (filters.sortField !== field)
      return <span className="ml-1 opacity-30">↕</span>;
    return (
      <span className="ml-1">{filters.sortDir === "asc" ? "↑" : "↓"}</span>
    );
  };

  return (
    <main className="min-h-screen p-4 bg-[#0a0a0a]">
      <Header
        subtitle="View your transaction history"
        isConnected={isConnected}
        isConnecting={isConnecting}
        walletAddress={wallet?.publicKey}
        onConnect={(walletType) => connect(walletType)}
        onDisconnect={disconnect}
      />

      <section className="border border-[#333333] px-[2.6rem] py-8 max-[1100px]:p-4 mt-6">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wider mb-1">
              Transaction History
            </h1>
            <p className="text-xs text-[#777777] tracking-wide">
              {isConnected
                ? `Showing ${filtered.length} of ${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`
                : "Connect your wallet to view transaction history"}
            </p>
          </div>
          <a
            href="/"
            className={cn(
              "self-start sm:self-auto text-[10px] tracking-widest uppercase text-[#c9a962] border border-[#c9a962] px-4 py-2 min-h-[44px] flex items-center",
              "hover:bg-[#c9a962] hover:text-[#0a0a0a] transition-colors duration-150",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962]",
            )}
          >
            ← Back to Dashboard
          </a>
        </div>

        {!isConnected ? (
          <div className="border border-[#333333] bg-[#111111] p-12 text-center">
            <p className="text-sm text-[#777777] mb-4">
              Please connect your wallet to view transaction history
            </p>
            <button
              onClick={() => connect()}
              className={cn(
                "px-6 py-3 min-h-[44px] text-xs tracking-widest border border-[#c9a962]",
                "text-[#c9a962] bg-transparent transition-colors duration-150",
                "hover:bg-[#c9a962] hover:text-[#0a0a0a]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a962]",
              )}
            >
              CONNECT WALLET
            </button>
          </div>
        ) : isLoading ? (
          <TransactionTableSkeleton rows={5} />
        ) : error ? (
          <div
            role="alert"
            className="border border-red-500/30 bg-red-500/10 p-6 text-center"
          >
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : (
          <>
            <ExportControls
              transactions={transactions}
              walletAddress={wallet?.publicKey}
            />

            {/* ── Filters ── */}
            <div className="border border-[#333333] bg-[#111111] p-4 mt-4">
              <div className="flex flex-wrap gap-3 items-end">
                {/* Search */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#777777] uppercase tracking-widest">
                    Search
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => set("search", e.target.value)}
                    placeholder="TX hash or ID"
                    aria-label="Search transactions"
                    className={cn(
                      "w-48 bg-[#0a0a0a] border border-[#333333] px-3 py-2",
                      "text-xs text-white placeholder-[#555555]",
                      "focus:outline-none focus:border-[#c9a962]",
                    )}
                  />
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#777777] uppercase tracking-widest">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      set("status", e.target.value as Filters["status"])
                    }
                    aria-label="Filter by status"
                    className={cn(
                      "bg-[#0a0a0a] border border-[#333333] px-3 py-2",
                      "text-xs text-white",
                      "focus:outline-none focus:border-[#c9a962]",
                    )}
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Date from */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#777777] uppercase tracking-widest">
                    From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => set("dateFrom", e.target.value)}
                    aria-label="Filter from date"
                    className={cn(
                      "bg-[#0a0a0a] border border-[#333333] px-3 py-2",
                      "text-xs text-white [color-scheme:dark]",
                      "focus:outline-none focus:border-[#c9a962]",
                    )}
                  />
                </div>

                {/* Date to */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#777777] uppercase tracking-widest">
                    To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => set("dateTo", e.target.value)}
                    aria-label="Filter to date"
                    className={cn(
                      "bg-[#0a0a0a] border border-[#333333] px-3 py-2",
                      "text-xs text-white [color-scheme:dark]",
                      "focus:outline-none focus:border-[#c9a962]",
                    )}
                  />
                </div>

                {/* Amount min */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#777777] uppercase tracking-widest">
                    Min USDC
                  </label>
                  <input
                    type="number"
                    value={filters.amountMin}
                    onChange={(e) => set("amountMin", e.target.value)}
                    placeholder="0"
                    aria-label="Minimum amount"
                    className={cn(
                      "w-24 bg-[#0a0a0a] border border-[#333333] px-3 py-2",
                      "text-xs text-white placeholder-[#555555]",
                      "focus:outline-none focus:border-[#c9a962]",
                    )}
                  />
                </div>

                {/* Amount max */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#777777] uppercase tracking-widest">
                    Max USDC
                  </label>
                  <input
                    type="number"
                    value={filters.amountMax}
                    onChange={(e) => set("amountMax", e.target.value)}
                    placeholder="∞"
                    aria-label="Maximum amount"
                    className={cn(
                      "w-24 bg-[#0a0a0a] border border-[#333333] px-3 py-2",
                      "text-xs text-white placeholder-[#555555]",
                      "focus:outline-none focus:border-[#c9a962]",
                    )}
                  />
                </div>

                {/* Reset */}
                {hasActiveFilters && (
                  <button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className={cn(
                      "ml-auto text-[10px] tracking-widest uppercase px-3 py-2",
                      "border border-[#555555] text-[#777777]",
                      "hover:border-[#c9a962] hover:text-[#c9a962] transition-colors duration-150",
                    )}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>

            {/* ── Table ── */}
            {filtered.length === 0 ? (
              <div className="border border-[#333333] bg-[#111111] p-12 text-center mt-4">
                <p className="text-sm text-[#777777]">
                  {transactions.length === 0
                    ? "No transactions found"
                    : "No transactions match the current filters"}
                </p>
              </div>
            ) : (
              <div className="border border-[#333333] bg-[#111111] overflow-x-auto mt-4">
                <table
                  className="w-full min-w-[800px] border-collapse"
                  aria-label="Transaction history"
                >
                  <thead>
                    <tr className="bg-[#c9a962]">
                      {/* Sortable: DATE */}
                      <th
                        className="px-5 py-2.5 text-left text-[10px] tracking-[0.18em] font-semibold text-[#0a0a0a] uppercase whitespace-nowrap cursor-pointer select-none"
                        onClick={() => toggleSort("timestamp")}
                        aria-sort={
                          filters.sortField === "timestamp"
                            ? filters.sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        DATE <SortIcon field="timestamp" />
                      </th>
                      <th className="px-5 py-2.5 text-left text-[10px] tracking-[0.18em] font-semibold text-[#0a0a0a] uppercase whitespace-nowrap">
                        TX HASH
                      </th>
                      {/* Sortable: AMOUNT */}
                      <th
                        className="px-5 py-2.5 text-left text-[10px] tracking-[0.18em] font-semibold text-[#0a0a0a] uppercase whitespace-nowrap cursor-pointer select-none"
                        onClick={() => toggleSort("amount")}
                        aria-sort={
                          filters.sortField === "amount"
                            ? filters.sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        AMOUNT <SortIcon field="amount" />
                      </th>
                      <th className="px-5 py-2.5 text-left text-[10px] tracking-[0.18em] font-semibold text-[#0a0a0a] uppercase whitespace-nowrap">
                        CURRENCY
                      </th>
                      <th className="px-5 py-2.5 text-left text-[10px] tracking-[0.18em] font-semibold text-[#0a0a0a] uppercase whitespace-nowrap">
                        BANK
                      </th>
                      <th className="px-5 py-2.5 text-left text-[10px] tracking-[0.18em] font-semibold text-[#0a0a0a] uppercase whitespace-nowrap">
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx, i) => (
                      <tr
                        key={tx.id}
                        className={cn(
                          "border-b border-[#222222] transition-colors duration-100",
                          i % 2 === 0 ? "bg-[#111111]" : "bg-[#0f0f0f]",
                          "hover:bg-[#1a1a1a]",
                        )}
                      >
                        <td className="px-5 py-3 text-xs text-[#aaaaaa] whitespace-nowrap">
                          {formatDate(tx.timestamp)}
                        </td>
                        <td className="px-5 py-3 text-xs text-[#777777] font-mono whitespace-nowrap">
                          {tx.stellarTxHash ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://stellar.expert/explorer/public/tx/${tx.stellarTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[#c9a962] transition-colors duration-150 underline decoration-dotted"
                              >
                                {truncateTxHash(tx.stellarTxHash)}
                              </a>
                              <CopyButton
                                text={tx.stellarTxHash}
                                label=""
                                className="text-[10px]"
                              />
                            </div>
                          ) : (
                            <span className="text-[#555555]">Pending</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-white tabular-nums whitespace-nowrap">
                          {tx.amount} USDC
                        </td>
                        <td className="px-5 py-3 text-xs text-white whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            {getCurrencyFlag(tx.currency) && (
                              <span
                                aria-hidden="true"
                                className="text-base leading-none"
                              >
                                {getCurrencyFlag(tx.currency)}
                              </span>
                            )}
                            {getCurrencySymbol(tx.currency)} {tx.currency}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-[#aaaaaa] whitespace-nowrap">
                          {tx.beneficiary.institution}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <StatusBadge status={tx.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
