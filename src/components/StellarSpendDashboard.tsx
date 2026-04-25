"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import FormCard, { type OfframpPayload, type QuoteResult } from "@/components/FormCard";
import RightPanel from "@/components/RightPanel";
import RecentOfframpsTable from "@/components/RecentOfframpsTable";
import ProgressSteps from "@/components/ProgressSteps";
import { TransactionProgressModal } from "@/components/TransactionProgressModal";
import { Header } from "@/components/Header";
import { TransactionStorage, type Transaction } from "@/lib/transaction-storage";
import { pollBridgeStatus, pollPayoutStatus } from "@/lib/offramp/utils/polling";
import type { OfframpStep } from "@/types/stellaramp";

// ---------------------------------------------------------------------------
// Horizon balance helpers
// ---------------------------------------------------------------------------

const HORIZON_URL = "https://horizon.stellar.org";
// Prefer the env-configured issuer; fall back to the well-known Circle mainnet issuer.
const USDC_ISSUER =
  process.env.NEXT_PUBLIC_STELLAR_USDC_ISSUER ||
  "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

function fmt(value: string, fractions: { min: number; max: number }): string {
  const n = parseFloat(value);
  if (isNaN(n)) return "0.00";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: fractions.min,
    maximumFractionDigits: fractions.max,
  });
}

async function fetchStellarBalances(
  publicKey: string
): Promise<{ usdc: string; xlm: string }> {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
    if (!res.ok) return { usdc: "0.00", xlm: "0.00" };
    const data = await res.json();
    const balances: Array<{
      asset_type: string;
      asset_code?: string;
      asset_issuer?: string;
      balance: string;
    }> = data.balances ?? [];

    const xlmEntry = balances.find((b) => b.asset_type === "native");
    const usdcEntry = balances.find(
      (b) =>
        b.asset_type === "credit_alphanum4" &&
        b.asset_code === "USDC" &&
        b.asset_issuer === USDC_ISSUER
    );

    return {
      xlm: xlmEntry ? fmt(xlmEntry.balance, { min: 2, max: 6 }) : "0.00",
      usdc: usdcEntry ? fmt(usdcEntry.balance, { min: 2, max: 6 }) : "0.00",
    };
  } catch {
    return { usdc: "0.00", xlm: "0.00" };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StellarSpendDashboard() {
  const { wallet, isConnected, isConnecting, connect, disconnect, signTransaction } = useStellarWallet();

  // Balances
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [xlmBalance, setXlmBalance] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  // Lifted form state (for RightPanel sync)
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  // Modal
  const [modalStep, setModalStep] = useState<OfframpStep>("idle");
  const [modalError, setModalError] = useState<string | undefined>(undefined);

  // Transaction history
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Form reset key — increment to wipe FormCard fields
  const [formResetKey, setFormResetKey] = useState(0);

  // Abort ref for in-flight polling (allows cleanup on unmount / new trade)
  const abortRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Load balances on wallet connect
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isConnected || !wallet?.publicKey) {
      setUsdcBalance(null);
      setXlmBalance(null);
      return;
    }

    setIsBalanceLoading(true);
    fetchStellarBalances(wallet.publicKey)
      .then(({ usdc, xlm }) => {
        setUsdcBalance(usdc);
        setXlmBalance(xlm);
      })
      .catch(() => {
        setUsdcBalance("0.00");
        setXlmBalance("0.00");
      })
      .finally(() => setIsBalanceLoading(false));
  }, [isConnected, wallet?.publicKey]);

  // ---------------------------------------------------------------------------
  // Load transaction history on wallet connect
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isConnected || !wallet?.publicKey) {
      setTransactions([]);
      return;
    }
    setTransactions(TransactionStorage.getByUser(wallet.publicKey));
  }, [isConnected, wallet?.publicKey]);

  // ---------------------------------------------------------------------------
  // Wallet handlers
  // ---------------------------------------------------------------------------
  const handleConnect = useCallback(async () => {
    try {
      await connect();
    } catch {
      // error surfaced via useStellarWallet.error
    }
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setAmount("");
    setCurrency("");
    setQuote(null);
    setTransactions([]);
  }, [disconnect]);

  // ---------------------------------------------------------------------------
  // Pre-flight balance check
  // ---------------------------------------------------------------------------
  const MIN_XLM_RESERVE = 3;
  const ESTIMATED_GAS = 2.5;

  function parseBalance(raw: string | null): number {
    if (!raw) return 0;
    return Number(raw.replace(/,/g, ""));
  }

  function checkBalance(payload: OfframpPayload): string | null {
    const usdc = parseBalance(usdcBalance);
    const needed = Number(payload.amount);

    if (!isNaN(needed) && needed > usdc) {
      return `Insufficient USDC balance. You have ${usdcBalance ?? "0"} USDC but are trying to send ${payload.amount} USDC.`;
    }

    if (payload.feeMethod === "XLM") {
      const xlm = parseBalance(xlmBalance);
      const required = MIN_XLM_RESERVE + ESTIMATED_GAS;
      if (xlm < required) {
        return `Insufficient XLM for gas. You need at least ${required} XLM (Reserve + Gas) but have ${xlmBalance ?? "0"} XLM. Try switching to USDC fee payment.`;
      }
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // Soroban tx status poller (for PENDING status)
  // ---------------------------------------------------------------------------
  async function pollSorobanTx(txHash: string): Promise<void> {
    const maxAttempts = 30;
    const interval = 3000;
    let attempt = 0;

    while (attempt < maxAttempts) {
      if (abortRef.current) throw new Error("Polling cancelled");
      
      attempt++;
      const res = await fetch(`/api/offramp/bridge/tx-status/${txHash}`);
      const data = await res.json();
      const status = data.status ?? "NOT_FOUND";

      if (status === "SUCCESS") {
        return;
      }
      if (status === "FAILED") {
        throw new Error("Transaction failed on-chain. Your wallet was not debited.");
      }
      if (status === "NOT_FOUND") {
        // Keep polling, tx may not be indexed yet
        await new Promise(resolve => setTimeout(resolve, interval));
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error("Transaction was not confirmed within 90s. It may have expired.");
  }

  // ---------------------------------------------------------------------------
  // Bridge status poller
  // ---------------------------------------------------------------------------
  async function pollBridge(txHash: string, txId: string): Promise<void> {
    await pollBridgeStatus(
      async () => {
        if (abortRef.current) return { status: "failed" };
        const res = await fetch(`/api/offramp/bridge/status/${txHash}`);
        const data = await res.json();
        return { status: data.status ?? "pending" };
      },
      ["completed", "failed", "expired"],
      {
        interval: 5000,
        timeout: 600_000,
        onProgress: () => {
          if (!abortRef.current) setModalStep("processing");
        },
      }
    );

    TransactionStorage.update(txId, { bridgeStatus: "completed" });
  }

  // ---------------------------------------------------------------------------
  // Payout status poller
  // ---------------------------------------------------------------------------
  async function pollPayout(orderId: string, txId: string): Promise<void> {
    setModalStep("settling");

    const result = await pollPayoutStatus(
      async () => {
        if (abortRef.current) return { status: "expired" };
        const res = await fetch(`/api/offramp/status/${orderId}`);
        const data = await res.json();
        return { status: data.status ?? "pending" };
      },
      ["settled", "refunded", "expired"],
      {
        interval: 10_000,
        timeout: 600_000,
      }
    );

    if (result.status === "settled") {
      TransactionStorage.update(txId, { payoutStatus: "settled", status: "completed" });
    } else {
      TransactionStorage.update(txId, { payoutStatus: result.status, status: "failed" });
      throw new Error(`Payout ended with status: ${result.status}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Main trade execution flow
  // ---------------------------------------------------------------------------
  const handleExecuteTrade = useCallback(
    async (payload: OfframpPayload) => {
      if (!wallet?.publicKey) return;

      // Pre-flight balance check
      const balanceError = checkBalance(payload);
      if (balanceError) {
        setModalError(balanceError);
        setModalStep("error");
        return;
      }

      abortRef.current = false;
      setModalError(undefined);
      setModalStep("initiating");

      // Create a pending transaction record
      const txId = TransactionStorage.generateId();
      const txRecord: Transaction = {
        id: txId,
        timestamp: Date.now(),
        userAddress: wallet.publicKey,
        amount: payload.amount,
        currency: payload.currency,
        status: "pending",
        beneficiary: {
          institution: payload.institution,
          accountIdentifier: payload.accountIdentifier,
          accountName: payload.accountName,
          currency: payload.currency,
        },
      };
      TransactionStorage.save(txRecord);

      try {
        // Step 1 — build bridge transaction XDR
        setModalStep("awaiting-signature");
        const buildRes = await fetch("/api/offramp/bridge/build-tx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: payload.amount,
            fromAddress: wallet.publicKey,
            feeMethod: payload.feeMethod,
            quote: payload.quote,
          }),
        });
        const buildData = await buildRes.json();
        if (!buildRes.ok) throw new Error(buildData.error ?? "Failed to build transaction");

        const { xdr, toAddress } = buildData as { xdr: string; toAddress: string };

        // Step 2 — sign transaction (wallet prompt)
        const signedXdr = await signTransaction(xdr);

        // Step 3 — submit to network
        setModalStep("submitting");
        const submitRes = await fetch("/api/offramp/bridge/submit-soroban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signedXdr }),
        });
        const submitData = await submitRes.json();
        if (!submitRes.ok) throw new Error(submitData.error ?? "Failed to submit transaction");

        const { status: submitStatus, hash: txHash } = submitData as { status: string; hash: string };
        TransactionStorage.update(txId, { stellarTxHash: txHash });

        // If PENDING, poll until SUCCESS/FAILED
        if (submitStatus === "PENDING") {
          await pollSorobanTx(txHash);
        }

        // Step 4 — poll bridge status
        setModalStep("processing");
        await pollBridge(txHash, txId);

        // Step 5 — execute payout
        const payoutRes = await fetch("/api/offramp/execute-payout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAddress: wallet.publicKey,
            amount: payload.amount,
            currency: payload.currency,
            feeMethod: payload.feeMethod,
            receiveAmount: payload.quote?.destinationAmount,
            beneficiary: {
              institution: payload.institution,
              accountIdentifier: payload.accountIdentifier,
              accountName: payload.accountName,
              currency: payload.currency,
            },
            toAddress,
            txHash,
          }),
        });
        const payoutData = await payoutRes.json();
        if (!payoutRes.ok) throw new Error(payoutData.error ?? "Failed to execute payout");

        const { orderId } = payoutData as { orderId: string };
        TransactionStorage.update(txId, { payoutOrderId: orderId });

        // Step 6 — poll payout status
        await pollPayout(orderId, txId);

        // Success
        setModalStep("success");
        setFormResetKey((k: number) => k + 1);

        // Refresh balances and history
        const { usdc, xlm } = await fetchStellarBalances(wallet.publicKey);
        setUsdcBalance(usdc);
        setXlmBalance(xlm);
        setTransactions(TransactionStorage.getByUser(wallet.publicKey));
      } catch (err: unknown) {
        if (abortRef.current) return; // user navigated away
        const msg = err instanceof Error ? err.message : "An unexpected error occurred";
        TransactionStorage.update(txId, { status: "failed", error: msg });
        setTransactions(TransactionStorage.getByUser(wallet.publicKey));
        setModalError(msg);
        setModalStep("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wallet?.publicKey, usdcBalance, xlmBalance, signTransaction]
  );

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main className="min-h-screen p-4 bg-[#0a0a0a]">
      <TransactionProgressModal
        step={modalStep}
        errorMessage={modalError}
        onClose={() => {
          setModalStep("idle");
          setModalError(undefined);
        }}
      />

      <Header
        subtitle="Offramp Dashboard"
        isConnected={isConnected}
        isConnecting={isConnecting}
        walletAddress={wallet?.publicKey}
        walletType={wallet?.type === "freighter" ? "Freighter" : wallet?.type === "lobstr" ? "Lobstr" : null}
        stellarUsdcBalance={usdcBalance}
        stellarXlmBalance={xlmBalance}
        isBalanceLoading={isBalanceLoading}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <section className="border border-[#333333] px-4 py-6 sm:px-8 sm:py-8 overflow-hidden mt-6">
        <div className="grid grid-cols-1 min-[1100px]:grid-cols-[1fr_370px] gap-6 w-full">
          {/* Left: form */}
          <div data-testid="FormCard">
            <FormCard
              isConnected={isConnected}
              isConnecting={isConnecting}
              resetKey={formResetKey}
              onConnect={handleConnect}
              onSubmit={handleExecuteTrade}
              onQuoteChange={setQuote}
              onAmountChange={setAmount}
              onCurrencyChange={setCurrency}
            />
          </div>

          {/* Right: payout preview */}
          <div
            data-testid="RightPanel"
            className="min-[1100px]:col-start-2 min-[1100px]:row-start-1 min-[1100px]:row-span-2"
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

          {/* Recent offramps */}
          <div>
            <RecentOfframpsTable />
          </div>

          {/* Progress steps */}
          <div className="min-[1100px]:col-span-2 mt-4">
            <ProgressSteps isConnected={isConnected} isConnecting={isConnecting} />
          </div>
        </div>
      </section>
    </main>
  );
}
