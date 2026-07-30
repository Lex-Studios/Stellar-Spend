"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import { cn } from "@/lib/cn";
import type { FxRate } from "@/app/api/fx-rates/route";
import React from "react";

const QUOTE_TTL = 30; // seconds before a fetched rate is considered stale

export default function CurrencyConverter({
  className,
}: {
  className?: string;
}) {
  const [fromAmount, setFromAmount] = useState("100");
  const [toAmount, setToAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USDC");
  const [toCurrency, setToCurrency] = useState("NGN");
  const [rate, setRate] = useState<number | null>(null);
  const [fees, setFees] = useState({ bridge: "0.5", payout: "0" });
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [quoteSecondsLeft, setQuoteSecondsLeft] = useState(QUOTE_TTL);
  const [isStale, setIsStale] = useState(false);
  const [rateUpdated, setRateUpdated] = useState(false);
  const rateUpdatedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCurrencies = useCallback(async () => {
    try {
      const res = await fetch("/api/offramp/currencies");
      if (res.ok) {
        const data = await res.json();
        startTransition(() => {
          setCurrencies(data.currencies || []);
        });
      }
    } catch (error) {
      console.error("Failed to fetch currencies:", error);
    }
  }, []);

  const fetchRate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/offramp/rate");
      if (res.ok) {
        const data: FxRate = await res.json();
        setRate(data.rate);
        if (rateUpdatedTimer.current) clearTimeout(rateUpdatedTimer.current);
        setRateUpdated(true);
        rateUpdatedTimer.current = setTimeout(
          () => setRateUpdated(false),
          1_500,
        );
      }
    } catch (error) {
      console.error("Failed to fetch rate:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrencies();
    fetchRate();
    const interval = setInterval(fetchRate, 30_000);
    return () => {
      clearInterval(interval);
      if (rateUpdatedTimer.current) clearTimeout(rateUpdatedTimer.current);
    };
  }, [toCurrency, fetchCurrencies, fetchRate]);

  // Restart the countdown whenever a new rate arrives
  useEffect(() => {
    if (rate === null) return;
    setIsStale(false);
    setQuoteSecondsLeft(QUOTE_TTL);
    const id = setInterval(() => {
      setQuoteSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsStale(true);
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);
    return () => clearInterval(id);
  }, [rate]);

  const handleFromAmountChange = useCallback(
    (value: string) => {
      setFromAmount(value);
      if (rate && value) {
        const amount = parseFloat(value);
        const total = amount * rate;
        const afterFees = total - (amount * parseFloat(fees.bridge)) / 100;
        setToAmount(afterFees.toFixed(2));
      } else {
        setToAmount("");
      }
    },
    [rate, fees.bridge],
  );

  const handleToAmountChange = useCallback(
    (value: string) => {
      setToAmount(value);
      if (rate && value) {
        const amount = parseFloat(value);
        const beforeFees = amount / (1 - parseFloat(fees.bridge) / 100);
        setFromAmount((beforeFees / rate).toFixed(2));
      } else {
        setFromAmount("");
      }
    },
    [rate, fees.bridge],
  );

  const swapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  }, [fromCurrency, toCurrency, fromAmount, toAmount]);

  const copyResult = useCallback(() => {
    const text = `${fromAmount} ${fromCurrency} = ${toAmount} ${toCurrency}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fromAmount, fromCurrency, toAmount, toCurrency]);

  const currencyOptions = useMemo(
    () =>
      currencies.map((curr) => (
        <option key={curr} value={curr}>
          {curr}
        </option>
      )),
    [currencies],
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900",
        className,
      )}
    >
      <h2 className="mb-4 text-lg font-semibold">Currency Converter</h2>

      {/* From Amount */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          From
        </label>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => handleFromAmountChange(e.target.value)}
            placeholder="0.00"
            className="flex-1 rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
          />
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
          >
            <option>USDC</option>
            <option>USDT</option>
          </select>
        </div>
      </div>

      {/* Swap Button */}
      <div className="mb-4 flex justify-center">
        <button
          onClick={swapCurrencies}
          className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600"
          aria-label="Swap currencies"
        >
          ⇅
        </button>
      </div>

      {/* To Amount */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          To
        </label>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            value={toAmount}
            onChange={(e) => handleToAmountChange(e.target.value)}
            placeholder="0.00"
            className="flex-1 rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
          />
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
          >
            {currencyOptions}
          </select>
        </div>
      </div>

      {/* Rate Info with countdown */}
      {rate && (
        <div className="mb-4 rounded bg-gray-50 p-3 text-sm dark:bg-gray-800">
          <div className="flex items-center justify-between gap-2">
            <p className="text-gray-600 dark:text-gray-400">
              1 {fromCurrency} = {rate.toFixed(2)} {toCurrency}
            </p>
            <span
              className={cn(
                "shrink-0 text-xs tabular-nums transition-colors",
                rateUpdated
                  ? "font-medium text-green-500"
                  : isStale
                    ? "text-amber-500"
                    : "text-gray-400 dark:text-gray-500",
              )}
              aria-live="polite"
            >
              {rateUpdated
                ? "Rate updated"
                : isStale
                  ? "Rate expired"
                  : `Refreshes in ${quoteSecondsLeft}s`}
            </span>
          </div>
        </div>
      )}

      {/* Stale rate warning */}
      {isStale && !loading && (
        <div
          role="alert"
          className="mb-4 rounded border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400"
        >
          The displayed rate has expired. A fresh rate will load automatically —
          wait a moment before submitting.
        </div>
      )}

      {/* Fees Breakdown */}
      <div className="mb-4 space-y-2 rounded bg-gray-50 p-3 text-sm dark:bg-gray-800">
        <p className="font-medium text-gray-700 dark:text-gray-300">Fees</p>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Bridge Fee:</span>
          <span>{fees.bridge}%</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Payout Fee:</span>
          <span>{fees.payout}%</span>
        </div>
      </div>

      {/* Copy Button — disabled when rate is stale to prevent copying an outdated conversion */}
      <button
        onClick={copyResult}
        disabled={isStale || !toAmount}
        title={
          isStale ? "Wait for the rate to refresh before copying" : undefined
        }
        className={cn(
          "w-full rounded px-4 py-2 font-medium transition-colors",
          copied
            ? "bg-green-500 text-white"
            : isStale
              ? "cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              : "bg-blue-500 text-white hover:bg-blue-600",
        )}
      >
        {copied ? "Copied!" : "Copy Result"}
      </button>

      {loading && (
        <p className="mt-2 text-center text-sm text-gray-500">
          Updating rates...
        </p>
      )}
    </div>
  );
}
