"use client";

import { cn } from "@/lib/cn";

export interface HeaderProps {
  subtitle: string;
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress?: string;
  walletType?: "Freighter" | "Lobstr" | null;
  stellarUsdcBalance?: string | null;
  stellarXlmBalance?: string | null;
  isBalanceLoading?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function WalletButton({
  isConnected,
  isConnecting,
  walletAddress,
  walletType,
  onConnect,
  onDisconnect,
}: Pick<HeaderProps, "isConnected" | "isConnecting" | "walletAddress" | "walletType" | "onConnect" | "onDisconnect">) {
  const label = isConnecting
    ? "CONNECTING..."
    : isConnected && walletAddress
    ? truncateAddress(walletAddress)
    : "CONNECT WALLET";

  const disabled = isConnecting;

  return (
    <div className="flex items-center gap-2">
      {isConnected && walletType && (
        <span className="text-xs text-slate-500 tracking-widest">{walletType.toUpperCase()}</span>
      )}
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
    </div>
  );
}

export function Header({
  subtitle,
  isConnected,
  isConnecting,
  walletAddress,
  walletType,
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
          walletType={walletType}
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
