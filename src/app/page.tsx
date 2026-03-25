"use client";

import { useState, useCallback } from "react";
import FormCard, { type OfframpPayload, type QuoteResult } from "@/components/FormCard";
import RightPanel from "@/components/RightPanel";
import RecentOfframpsTable from "@/components/RecentOfframpsTable";
import ProgressSteps from "@/components/ProgressSteps";
import { TransactionProgressModal } from "@/components/TransactionProgressModal";
import { OfframpStep } from "@/types/stellaramp";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  
  // Test state for modal
  const [modalStep, setModalStep] = useState<OfframpStep>("idle");

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
    // Show modal for testing
    setModalStep("initiating");
    
    // Simulate flow
    const flow: OfframpStep[] = ["awaiting-signature", "submitting", "processing", "settling", "success"];
    for (const step of flow) {
      await new Promise(r => setTimeout(r, 1500));
      setModalStep(step);
    }
  }, []);

  return (
    <main className="min-h-screen p-4 bg-[#0a0a0a]">
      <TransactionProgressModal 
        step={modalStep} 
        onClose={() => setModalStep("idle")} 
      />
      
      <Header
        subtitle="Offramp Dashboard"
        isConnected={isConnected}
        isConnecting={isConnecting}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
      <section className="border border-[#333333] px-[2.6rem] py-8 max-[1100px]:p-4 overflow-hidden mt-6">
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
          <div className="col-span-1 min-[1101px]:col-span-2 mt-4 max-[1100px]:block">
            <ProgressSteps isConnected={isConnected} isConnecting={isConnecting} />
          </div>
        </div>
      </section>
    </main>
  );
}
