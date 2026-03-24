"use client";

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
