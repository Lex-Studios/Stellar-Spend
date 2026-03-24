
import { Skeleton } from "./ui/Skeleton";

"use client";

import { cn } from "@/lib/cn";


export interface HeaderProps {
  subtitle: string;
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress?: string;
  stellarUsdcBalance?: string | null;
  stellarXlmBalance?: string | null;
  isBalanceLoading?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}


export function Header({
  subtitle,
  isConnected,
  isConnecting,
  walletAddress,
  stellarUsdcBalance,
  stellarXlmBalance,
  isBalanceLoading = false,
  onConnect,
  onDisconnect,
}: HeaderProps) {
  const btnLabel = isConnecting
    ? "CONNECTING..."
    : isConnected
    ? truncate(walletAddress ?? "")
    : "CONNECT WALLET";

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 32,
      }}
    >
      {/* Title */}
      <div>
        <h1
          className="font-space-grotesk"
          style={{
            margin: 0,
            fontSize: "clamp(1.4rem, 3vw, 2rem)",
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          STELLAR-SPEND
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>{subtitle}</p>
      </div>

      {/* Wallet button + balances */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <button
          onClick={isConnected ? onDisconnect : onConnect}
          disabled={isConnecting}
          aria-label={isConnected ? "Disconnect wallet" : "Connect wallet"}
          style={{
            border: "1px solid var(--accent)",
            padding: "8px 16px",
            fontSize: 12,
            letterSpacing: "0.08em",
            background: "none",
            color: "var(--accent)",
            cursor: isConnecting ? "default" : "pointer",
            opacity: isConnecting ? 0.7 : 1,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!isConnecting) {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
              (e.currentTarget as HTMLButtonElement).style.color = "#000";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "none";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
          }}
        >
          {btnLabel}
        </button>

        {/* Balance rows — only shown when connected */}
        {isConnected && (
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}
            aria-live="polite"
            aria-label="Wallet balances"
          >
            {isBalanceLoading ? (
              <>
                <Skeleton width={110} height={13} aria-label="Loading USDC balance…" />
                <Skeleton width={90} height={13} aria-label="Loading XLM balance…" />
              </>
            ) : (
              <>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {stellarUsdcBalance ?? "0.00"} USDC
                </span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {stellarXlmBalance ?? "0.00"} XLM

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function WalletButton({
  isConnected,
  isConnecting,
  walletAddress,
  onConnect,
  onDisconnect,
}: Pick<HeaderProps, "isConnected" | "isConnecting" | "walletAddress" | "onConnect" | "onDisconnect">) {
  const label = isConnecting
    ? "CONNECTING..."
    : isConnected && walletAddress
    ? truncateAddress(walletAddress)
    : "CONNECT WALLET";

  const disabled = isConnecting;

  return (
    <button
      onClick={isConnected ? onDisconnect : onConnect}
      disabled={disabled}
      aria-label={isConnected ? "Disconnect wallet" : "Connect wallet"}
      className={cn(
        "px-4 py-2 text-xs tracking-widest border transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a962] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
        "border-[#c9a962] bg-[#0a0a0a] text-[#c9a962]",
        !disabled && "hover:bg-[#c9a962] hover:text-[#0a0a0a]",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      {label}
    </button>
  );
}

export default function Header({
  subtitle,
  isConnected,
  isConnecting,
  walletAddress,
  stellarUsdcBalance,
  stellarXlmBalance,
  isBalanceLoading,
  onConnect,
  onDisconnect,
}: HeaderProps) {
  return (
    <header className="w-full px-6 py-5 flex items-start justify-between gap-6 max-[720px]:flex-col max-[720px]:items-start">
      {/* Left: title + subtitle */}
      <div className="flex flex-col gap-1">
        <h1
          className="font-space-grotesk font-bold text-white leading-none tracking-tight"
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
        >
          STELLAR-SPEND
        </h1>
        <p className="text-xs text-[#777777] tracking-widest uppercase">{subtitle}</p>
      </div>

      {/* Right: wallet button + balances */}
      <div className="flex flex-col items-end gap-2 max-[720px]:items-start">
        <WalletButton
          isConnected={isConnected}
          isConnecting={isConnecting}
          walletAddress={walletAddress}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />

        {isConnected && (
          <div className="flex flex-col items-end gap-0.5 max-[720px]:items-start">
            {isBalanceLoading ? (
              <span className="text-xs text-[#777777] tracking-widest">loading...</span>
            ) : (
              <>
                <span className="text-xs text-[#c9a962] tracking-wider">
                  {stellarUsdcBalance ?? "—"} USDC
                </span>
                <span className="text-xs text-[#777777] tracking-wider">
                  {stellarXlmBalance ?? "—"} XLM

                </span>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}


function truncate(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

