"use client";

import { useEffect, useState } from "react";
import { TransactionStorage, type Transaction } from "@/lib/transaction-storage";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { Header } from "@/components/Header";
import { cn } from "@/lib/cn";

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
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

export default function HistoryPage() {
  const { wallet, isConnected, isConnecting, connect, disconnect } = useStellarWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (wallet?.publicKey) {
      const userTxs = TransactionStorage.getByUser(wallet.publicKey);
      setTransactions(userTxs);
    } else {
      setTransactions([]);
    }
  }, [wallet?.publicKey]);

  return (
    <main className="min-h-screen p-4 bg-[#0a0a0a]">
      <Header
        subtitle="View your transaction history"
        isConnected={isConnected}
        isConnecting={isConnecting}
        walletAddress={wallet?.publicKey}
        onConnect={connect}
        onDisconnect={disconnect}
      />

      <section className="border border-[#333333] px-[2.6rem] py-8 max-[1100px]:p-4 mt-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider mb-2">
              Transaction History
            </h1>
            <p className="text-xs text-[#777777] tracking-wide">
              {isConnected
                ? `Showing ${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`
                : "Connect your wallet to view transaction history"}
            </p>
          </div>
          <a
            href="/"
            className={cn(
              "text-[10px] tracking-widest uppercase text-[#c9a962] border border-[#c9a962] px-4 py-2",
              "hover:bg-[#c9a962] hover:text-[#0a0a0a] transition-colors duration-150",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962]"
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
                "px-6 py-3 text-xs tracking-widest border border-[#c9a962]",
                "text-[#c9a962] bg-transparent transition-colors duration-150",
                "hover:bg-[#c9a962] hover:text-[#0a0a0a]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a962]"
              )}
            >
              CONNECT WALLET
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="border border-[#333333] bg-[#111111] p-12 text-center">
            <p className="text-sm text-[#777777]">No transactions found</p>
          </div>
        ) : (
          <div className="border border-[#333333] bg-[#111111] overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="bg-[#c9a962]">
                  {["DATE", "TX HASH", "AMOUNT", "CURRENCY", "BANK", "STATUS"].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-2.5 text-left text-[10px] tracking-[0.18em] font-semibold text-[#0a0a0a] uppercase whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className={cn(
                      "border-b border-[#222222] transition-colors duration-100",
                      i % 2 === 0 ? "bg-[#111111]" : "bg-[#0f0f0f]",
                      "hover:bg-[#1a1a1a]"
                    )}
                  >
                    <td className="px-5 py-3 text-xs text-[#aaaaaa] whitespace-nowrap">
                      {formatDate(tx.timestamp)}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#777777] font-mono whitespace-nowrap">
                      {tx.stellarTxHash ? (
                        <a
                          href={`https://stellar.expert/explorer/public/tx/${tx.stellarTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#c9a962] transition-colors duration-150 underline decoration-dotted"
                        >
                          {truncateTxHash(tx.stellarTxHash)}
                        </a>
                      ) : (
                        <span className="text-[#555555]">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-white tabular-nums whitespace-nowrap">
                      {tx.amount} USDC
                    </td>
                    <td className="px-5 py-3 text-xs text-white whitespace-nowrap">
                      {getCurrencySymbol(tx.currency)} {tx.currency}
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
      </section>
    </main>
  );
}
