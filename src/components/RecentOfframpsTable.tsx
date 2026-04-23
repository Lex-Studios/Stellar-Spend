"use client";

import { cn } from "@/lib/cn";
import type { RecentOfframpRow } from "@/types/stellaramp";
import { CopyButton } from "./CopyButton";
import { getCurrencyFlag } from "@/lib/currency-flags";

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

function StatusBadge({ status }: { status: RecentOfframpRow["status"] }) {
  return (
    <span
      className={cn(
        "inline-block px-2.5 py-0.5 text-[10px] tracking-widest uppercase font-semibold",
        status === "SETTLING"
          ? "bg-[#c9a962] text-[#0a0a0a]"
          : "border border-white text-white bg-transparent"
      )}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RecentOfframpsTable({ rows = MOCK_ROWS }: RecentOfframpsTableProps) {
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
            "text-[10px] tracking-widest uppercase text-[#c9a962] border border-[#c9a962] px-3 py-1",
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
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-xs text-[#555555] tracking-wider"
                >
                  No transactions yet
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

