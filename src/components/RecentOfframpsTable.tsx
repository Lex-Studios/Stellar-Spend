"use client";

import { cn } from "@/lib/cn";
import type { RecentOfframpRow } from "@/types/stellaramp";
import { CopyButton } from "./CopyButton";
import { getCurrencyFlag } from "@/lib/currency-flags";
import { TransactionTableSkeleton } from "./skeletons";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";

// ---------------------------------------------------------------------------
// Mock data — replaced by real TransactionStorage rows when wired up
// ---------------------------------------------------------------------------

const MOCK_ROWS: RecentOfframpRow[] = [
  { txHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2", usdc: "120.00", fiat: "₦192,000", currency: "NGN", status: "COMPLETE" },
  { txHash: "f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8", usdc: "50.50",  fiat: "₦80,800", currency: "NGN", status: "SETTLING" },
  { txHash: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12", usdc: "200.00", fiat: "₦320,000", currency: "NGN", status: "COMPLETE" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RecentOfframpsTableProps {
  rows?: ReadonlyArray<RecentOfframpRow>;
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateTxHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
}

function getCurrencyColumnHeader(rows: ReadonlyArray<RecentOfframpRow>): string {
  if (rows.length === 0) return "FIAT";
  const firstCurrency = rows[0].currency;
  const allSameCurrency = rows.every(row => row.currency === firstCurrency);
  return allSameCurrency ? firstCurrency.toUpperCase() : "FIAT";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RecentOfframpsTable({ rows = MOCK_ROWS, isLoading }: RecentOfframpsTableProps) {
  if (isLoading) {
    return <TransactionTableSkeleton rows={3} />;
  }

  if (rows.length === 0) {
    return (
      <div
        data-testid="RecentOfframpsTable"
        className="border border-[#333333] bg-[#111111]"
        role="region"
        aria-label="Recent offramp transactions"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#333333]">
          <span className="text-[10px] tracking-[0.2em] text-[#777777] uppercase">
            Recent Offramps
          </span>
          <a
            href="/history"
            className={cn(
              "text-[10px] tracking-widest uppercase text-[#c9a962] border border-[#c9a962] px-3 py-1 min-h-[44px] flex items-center",
              "hover:bg-[#c9a962] hover:text-[#0a0a0a] transition-colors duration-150",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962]"
            )}
            aria-label="View all offramp transactions"
          >
            View All
          </a>
        </div>
        <EmptyState
          icon={
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          }
          title="No transactions yet"
          description="Start by converting your Stellar stablecoins to fiat currency"
          action={{
            label: "Get Started",
            onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
          }}
        />
      </div>
    );
  }

  return (
    <div
      data-testid="RecentOfframpsTable"
      className="border border-[#333333] bg-[#111111]"
      role="region"
      aria-label="Recent offramp transactions"
    >
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#333333]">
        <span className="text-[10px] tracking-[0.2em] text-[#777777] uppercase">
          Recent Offramps
        </span>
        <a
          href="/history"
          className={cn(
            "text-[10px] tracking-widest uppercase text-[#c9a962] border border-[#c9a962] px-3 py-1 min-h-[44px] flex items-center",
            "hover:bg-[#c9a962] hover:text-[#0a0a0a] transition-colors duration-150",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962]"
          )}
          aria-label="View all offramp transactions"
        >
          View All
        </a>
      </div>

      {/* Horizontally scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse" aria-label="Recent offramp transactions table">
          {/* Gold header row */}
          <thead>
            <tr className="bg-[#c9a962]">
              {["TX HASH", "USDC", getCurrencyColumnHeader(rows), "STATUS"].map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-5 py-2.5 text-left text-[10px] tracking-[0.18em] font-semibold text-[#0a0a0a] uppercase whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.txHash}
                className={cn(
                  "border-b border-[#222222] transition-colors duration-100",
                  i % 2 === 0 ? "bg-[#111111]" : "bg-[#0f0f0f]",
                  "hover:bg-[#1a1a1a]"
                )}
              >
                <td className="px-5 py-3 text-xs text-[#777777] font-mono whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://stellar.expert/explorer/public/tx/${row.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#c9a962] transition-colors duration-150 underline decoration-dotted"
                    >
                      {truncateTxHash(row.txHash)}
                    </a>
                    <CopyButton text={row.txHash} label="" className="text-[10px]" />
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-white tabular-nums whitespace-nowrap">
                  {row.usdc} USDC
                </td>
                <td className="px-5 py-3 text-xs text-white tabular-nums whitespace-nowrap">
                  {row.fiat}
                  {" "}
                  <span className="text-[#777777]">
                    {getCurrencyFlag(row.currency) && (
                      <span aria-label={row.currency} title={row.currency} className="ml-1">
                        {getCurrencyFlag(row.currency)}
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

