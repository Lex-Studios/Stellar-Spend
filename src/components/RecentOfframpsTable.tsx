"use client";

import { Transaction } from "@/lib/transaction-storage";
import { cn } from "@/lib/cn";

interface RecentOfframpsTableProps {
  userTransactions: Transaction[];
}

function truncateHash(hash: string | undefined, length: number = 8): string {
  if (!hash) return "—";
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

function mapStatus(status: Transaction["status"]): string {
  const statusMap: Record<Transaction["status"], string> = {
    pending: "SETTLING",
    completed: "COMPLETE",
    failed: "FAILED",
  };
  return statusMap[status] || status;
}

function getStatusColor(status: Transaction["status"]): string {
  const colorMap: Record<Transaction["status"], string> = {
    pending: "text-yellow-500",
    completed: "text-green-500",
    failed: "text-red-500",
  };
  return colorMap[status] || "text-gray-500";
}

function RecentOfframpRow({ transaction }: { transaction: Transaction }) {
  const displayStatus = mapStatus(transaction.status);
  const statusColor = getStatusColor(transaction.status);

  return (
    <tr className="border-t border-[#222222] hover:bg-[#0f0f0f] transition-colors">
      <td className="px-4 py-3 text-sm text-[#cccccc]">
        {truncateHash(transaction.stellarTxHash)}
      </td>
      <td className="px-4 py-3 text-sm text-[#cccccc]">
        {transaction.amount} USDC
      </td>
      <td className="px-4 py-3 text-sm text-[#999999]">
        {transaction.currency}
      </td>
      <td className={cn("px-4 py-3 text-sm font-semibold", statusColor)}>
        {displayStatus}
      </td>
    </tr>
  );
}

export default function RecentOfframpsTable({
  userTransactions,
}: RecentOfframpsTableProps) {
  const displayTransactions = userTransactions.slice(0, 10);
  const hasTransactions = displayTransactions.length > 0;

  return (
    <div
      data-testid="RecentOfframpsTable"
      className="border border-[#333333] bg-[#111111] rounded-lg overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-[#222222]">
        <span className="text-[10px] tracking-[0.2em] text-[#777777] uppercase">
          Recent Offramps
        </span>
      </div>

      {!hasTransactions ? (
        <div className="px-5 py-12 text-center">
          <p className="text-[#777777] text-sm">No transactions yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#222222] bg-[#0a0a0a]">
                <th className="px-4 py-3 text-[10px] tracking-[0.2em] text-[#777777] uppercase font-semibold">
                  Tx Hash
                </th>
                <th className="px-4 py-3 text-[10px] tracking-[0.2em] text-[#777777] uppercase font-semibold">
                  Amount
                </th>
                <th className="px-4 py-3 text-[10px] tracking-[0.2em] text-[#777777] uppercase font-semibold">
                  Currency
                </th>
                <th className="px-4 py-3 text-[10px] tracking-[0.2em] text-[#777777] uppercase font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {displayTransactions.map((tx) => (
                <RecentOfframpRow key={tx.id} transaction={tx} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {userTransactions.length > 10 && (
        <div className="px-5 py-3 border-t border-[#222222] text-center">
          <button className="text-[10px] tracking-[0.2em] text-[#c9a962] uppercase font-semibold hover:text-[#d4af37] transition-colors">
            View All ({userTransactions.length})
          </button>
        </div>
      )}
    </div>
  );
}
