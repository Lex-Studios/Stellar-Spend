"use client";


import { useState } from "react";
import { Header } from "@/components/Header";
import { FormCard, type FeeOption } from "@/components/FormCard";

// Minimal dashboard wiring — full orchestration lives in StellarSpendDashboard (Issue 15)
export default function Page() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [xlmBalance, setXlmBalance] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [feeMethod, setFeeMethod] = useState<"native" | "stablecoin">("native");

  const [isLoadingCurrencies] = useState(false);
  const [isLoadingBanks] = useState(false);
  const [isLoadingQuote] = useState(false);
  const [isLoadingFees] = useState(false);
  const [isVerifyingAccount] = useState(false);

  const feeOptions: FeeOption[] = [
    { label: "XLM", method: "native", amount: "~0.001 XLM" },
    { label: "USDC", method: "stablecoin", amount: "~0.50 USDC" },
  ];

  async function handleConnect() {
    setIsConnecting(true);
    // Wallet connection handled by useStellarWallet in full implementation
    await new Promise((r) => setTimeout(r, 800));
    setIsConnecting(false);
    setIsConnected(true);
    setIsBalanceLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setUsdcBalance("1,250.00");
    setXlmBalance("42.50");
    setIsBalanceLoading(false);
  }

  function handleDisconnect() {
    setIsConnected(false);
    setUsdcBalance(null);
    setXlmBalance(null);
    setAmount("");
    setCurrency("");
    setBank("");
    setAccountNumber("");
    setAccountName("");
  }

  return (
    <main style={{ minHeight: "100vh", padding: "clamp(1rem, 3vw, 2.6rem)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Header
          subtitle="Convert Stellar USDC to fiat — fast, non-custodial."
          isConnected={isConnected}
          isConnecting={isConnecting}
          walletAddress="GCFX7ABCDE2YTK"
          stellarUsdcBalance={usdcBalance}
          stellarXlmBalance={xlmBalance}
          isBalanceLoading={isBalanceLoading}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />

        <FormCard
          amount={amount}
          currency={currency}
          bank={bank}
          accountNumber={accountNumber}
          accountName={accountName}
          feeMethod={feeMethod}
          currencies={[{ value: "NGN", label: "Nigerian Naira (NGN)" }]}
          banks={[{ value: "ACCESS", label: "Access Bank" }]}
          feeOptions={feeOptions}
          isLoadingCurrencies={isLoadingCurrencies}
          isLoadingBanks={isLoadingBanks}
          isLoadingQuote={isLoadingQuote}
          isLoadingFees={isLoadingFees}
          isVerifyingAccount={isVerifyingAccount}
          isConnected={isConnected}
          isConnecting={isConnecting}
          onAmountChange={setAmount}
          onCurrencyChange={setCurrency}
          onBankChange={setBank}
          onAccountNumberChange={setAccountNumber}
          onFeeMethodChange={setFeeMethod}
          onSubmit={() => {}}
        />
      </div>

import { useState, useCallback } from "react";
import FormCard, { type OfframpPayload, type QuoteResult } from "@/components/FormCard";
import RightPanel from "@/components/RightPanel";
import RecentOfframpsTable from "@/components/RecentOfframpsTable";
import ProgressSteps from "@/components/ProgressSteps";
import Header from "@/components/Header";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  const handleConnect = useCallback(() => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
    }, 1000);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setAmount("");
    setCurrency("");
    setQuote(null);
  }, []);

  const handleSubmit = useCallback(async (_payload: OfframpPayload) => {
    // Offramp submission logic placeholder
  }, []);

  return (
    <main className="min-h-screen p-4 bg-[#0a0a0a]">
      <Header
        subtitle="Offramp Dashboard"
        isConnected={isConnected}
        isConnecting={isConnecting}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
      <section className="border border-[#333333] px-[2.6rem] py-8 max-[1100px]:p-4 overflow-hidden">
        <div className="grid grid-cols-[1fr_370px] gap-6 max-[1100px]:grid-cols-1 overflow-hidden w-full">
          <div data-testid="FormCard">
            <FormCard
              isConnected={isConnected}
              isConnecting={isConnecting}
              onConnect={handleConnect}
              onSubmit={handleSubmit}
              onQuoteChange={setQuote}
              onAmountChange={setAmount}
              onCurrencyChange={setCurrency}
            />
          </div>
          <div
            data-testid="RightPanel"
            className="col-start-2 row-start-1 row-span-2 max-[1100px]:col-start-1 max-[1100px]:row-span-1"
          >
            <RightPanel
              isConnected={isConnected}
              isConnecting={isConnecting}
              amount={amount}
              quote={quote}
              isLoadingQuote={false}
              currency={currency}
              onConnect={handleConnect}
            />
          </div>
          <div>
            <RecentOfframpsTable />
          </div>
          <div className="max-[1100px]:block hidden">
            <ProgressSteps />
          </div>
        </div>
      </section>

    </main>
  );
}
