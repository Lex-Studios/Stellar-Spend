"use client";

import { useState, useCallback, useEffect } from "react";
import FormCard, { type OfframpPayload, type QuoteResult } from "@/components/FormCard";
import RightPanel from "@/components/RightPanel";
import RecentOfframpsTable from "@/components/RecentOfframpsTable";
import ProgressSteps from "@/components/ProgressSteps";
import { TransactionProgressModal } from "@/components/TransactionProgressModal";
import { Header } from "@/components/Header";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { useWalletFlow } from "@/hooks/useWalletFlow";
import { OfframpStep } from "@/types/stellaramp";
import { usePollPayoutStatus } from "@/hooks/usePollPayoutStatus";
import { TransactionStorage } from "@/lib/transaction-storage";

export default function Home() {
  const { wallet, isConnected, isConnecting: isWalletConnecting, error, connect, disconnect } = useStellarWallet();
  const { variant, steps, setConnecting, setConnected, setPreConnect } = useWalletFlow();

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [modalStep, setModalStep] = useState<OfframpStep>("idle");
  const [modalError, setModalError] = useState<string | undefined>();

  // Sync wallet flow state with wallet connection state
  useEffect(() => {
    if (isWalletConnecting) {
      setConnecting();
    } else if (isConnected) {
      setConnected();
    } else {
      setPreConnect();
    }
  }, [isWalletConnecting, isConnected, setConnecting, setConnected, setPreConnect]);

  const handleConnect = useCallback(async () => {
    setConnecting();
    const result = await connect();
    if (result) {
      setConnected();
    } else {
      setPreConnect();
    }
  }, [connect, setConnecting, setConnected, setPreConnect]);

  const handleDisconnect = useCallback(() => {
    // useStellarWallet.disconnect() calls adapter.disconnect() + TransactionStorage.clear()
    disconnect();
    setPreConnect();
    setAmount("");
    setCurrency("");
    setQuote(null);
  }, [disconnect, setPreConnect]);

  const { pollPayoutStatus } = usePollPayoutStatus();

  const handleSubmit = useCallback(async (payload: OfframpPayload) => {
    setModalStep("initiating");

    // Create a local transaction record
    const txId = TransactionStorage.generateId();
    TransactionStorage.save({
      id: txId,
      timestamp: Date.now(),
      userAddress: "unknown", // replaced once wallet is wired
      amount: payload.amount,
      currency: payload.currency,
      beneficiary: {
        institution: payload.institution,
        accountIdentifier: payload.accountIdentifier,
        accountName: payload.accountName,
        currency: payload.currency,
      },
      status: "pending",
    });

    try {
      // Step: awaiting-signature → submitting → processing
      // These steps will be driven by the real bridge/payout flow once those
      // routes are implemented. For now we advance through them and then poll.
      setModalStep("awaiting-signature");
      await new Promise(r => setTimeout(r, 800));
      setModalStep("submitting");
      await new Promise(r => setTimeout(r, 800));
      setModalStep("processing");

      // TODO: replace with real orderId from execute-payout once implemented
      // For now we read it from the payload if available, or skip polling.
      const orderId: string | undefined = (payload as OfframpPayload & { orderId?: string }).orderId;

      if (orderId) {
        TransactionStorage.update(txId, { payoutOrderId: orderId });

        await pollPayoutStatus(orderId, {
          transactionId: txId,
          onSettling: () => setModalStep("settling"),
        });

        TransactionStorage.update(txId, { status: "completed", payoutStatus: "settled" });
        setModalStep("success");
      } else {
        // No orderId yet — simulate settling for UI demo until execute-payout is wired
        setModalStep("settling");
        await new Promise(r => setTimeout(r, 1200));
        setModalStep("success");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      TransactionStorage.update(txId, { status: "failed", error: message });
      setModalStep("error");
      setModalError(message);
    }
  }, [pollPayoutStatus]);

  return (
    <main className="min-h-screen p-4 bg-[#0a0a0a]">
      <TransactionProgressModal 
        step={modalStep}
        errorMessage={modalError}
        onClose={() => { setModalStep("idle"); setModalError(undefined); }}
      />

      <Header
        subtitle={variant.subtitle}
        isConnected={isConnected}
        isConnecting={isWalletConnecting}
        walletAddress={wallet?.publicKey}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <section className="border border-[#333333] px-[2.6rem] py-8 max-[1100px]:p-4 overflow-hidden mt-6">
        <div className="grid grid-cols-[1fr_370px] gap-6 max-[1100px]:grid-cols-1 overflow-hidden w-full">
          <div data-testid="FormCard">
            <FormCard
              isConnected={isConnected}
              isConnecting={isWalletConnecting}
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
              isConnecting={isWalletConnecting}
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

          <div className="col-span-1 min-[1101px]:col-span-2 mt-4">
            <ProgressSteps
              isConnected={isConnected}
              isConnecting={isWalletConnecting}
              steps={steps}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
