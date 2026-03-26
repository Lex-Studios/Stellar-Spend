"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
} from "react";
import { cn } from "@/lib/cn";
import { validateAmount, validateAccountNumber, isValidQuote } from "@/lib/offramp/utils/validation";
import { buildQuote, calculateBridgeAmount } from "@/lib/offramp/utils/quote-fetcher";

// ---------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface GasFeeOptions {
  native: { int: string; float: string } | null;
  stablecoin: { int: string; float: string } | null;
}

export interface FeeOption {
  label: string;
  amount: string;
  method: "USDC" | "XLM";
}

export interface FeeOption {
  label: string;
  amount: string;
  method: "native" | "stablecoin";
}

export interface FormCardProps {
  /** Wallet state */
  isConnected: boolean;
  isConnecting: boolean;
  /** Increments to reset all fields */
  resetKey?: number;
  /** Callbacks */
  onConnect: () => void;
  onSubmit: (payload: OfframpPayload) => Promise<void>;
  /** Lifted state for RightPanel sync */
  onQuoteChange?: (quote: QuoteResult | null) => void;
  onAmountChange?: (amount: string) => void;
  onCurrencyChange?: (currency: string) => void;
}

export interface OfframpPayload {
  amount: string;
  currency: string;
  institution: string;
  accountIdentifier: string;
  accountName: string;
  feeMethod: FeeMethod;
  quote: QuoteResult;
}

export interface QuoteResult {
  destinationAmount: string;
  rate: number;
  currency: string;
  bridgeFee: string;
  payoutFee: string;
  estimatedTime: number;
}

type FeeMethod = "USDC" | "XLM";

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface Institution {
  code: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InputFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: string;
  step?: string;
  maxLength?: number;
  disabled?: boolean;
  suffix?: string;
  error?: string;
  inputMode?: "numeric" | "decimal" | "text";
}

function InputField({
  label,
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  step,
  maxLength,
  disabled,
  suffix,
  error,
  inputMode,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] tracking-[0.18em] text-[#777777] uppercase">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          step={step}
          maxLength={maxLength}
          disabled={disabled}
          inputMode={inputMode}
          className={cn(
            "w-full bg-[#0a0a0a] border px-3 py-2.5 text-sm text-white placeholder-[#444444]",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "transition-colors duration-150",
            error ? "border-red-500/60" : "border-[#333333] focus:border-[#c9a962]",
            suffix && "pr-20"
          )}
        />
        {suffix && (
          <span className="absolute right-3 text-xs text-[#777777] pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <span className="text-[10px] text-red-400 tracking-wide">{error}</span>
      )}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled,
  loading,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] tracking-[0.18em] text-[#777777] uppercase">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
          disabled={disabled || loading}
          className={cn(
            "w-full appearance-none bg-[#0a0a0a] border border-[#333333] px-3 py-2.5 text-sm",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962] focus:border-[#c9a962]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "transition-colors duration-150",
            value ? "text-white" : "text-[#444444]"
          )}
        >
          <option value="" disabled>
            {loading ? "Loading..." : placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#111111] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] text-xs">
          ▾
        </span>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  loading?: boolean;
  placeholder?: string;
}

function Field({ label, value, loading, placeholder = "—" }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] tracking-[0.18em] text-[#777777] uppercase">{label}</span>
      <div className="bg-[#0a0a0a] border border-[#333333] px-3 py-2.5 text-sm min-h-[42px] flex items-center">
        {loading ? (
          <span className="text-[#777777] text-xs tracking-wider">Resolving...</span>
        ) : value ? (
          <span className="text-[#c9a962]">{value}</span>
        ) : (
          <span className="text-[#444444]">{placeholder}</span>
        )}
      </div>
    </div>
  );
}

interface FeeMethodSelectorProps {
  value: FeeMethod;
  onChange: (v: FeeMethod) => void;
  usdcFee: string | null;
  xlmFee: string | null;
  disabled?: boolean;
}

function FeeMethodSelector({ value, onChange, usdcFee, xlmFee, disabled }: FeeMethodSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] tracking-[0.18em] text-[#777777] uppercase">Gas Fee Method</span>
      <div className="flex gap-2">
        {(["USDC", "XLM"] as FeeMethod[]).map((method) => {
          const fee = method === "USDC" ? usdcFee : xlmFee;
          const active = value === method;
          return (
            <button
              key={method}
              type="button"
              onClick={() => onChange(method)}
              disabled={disabled}
              className={cn(
                "flex-1 py-2.5 px-3 text-xs tracking-widest border transition-colors duration-150",
                "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962]",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                active
                  ? "border-[#c9a962] bg-[#c9a962]/10 text-[#c9a962]"
                  : "border-[#333333] bg-[#0a0a0a] text-[#777777] hover:border-[#c9a962]/50"
              )}
            >
              <span className="block font-semibold">{method}</span>
              {fee && (
                <span className="block text-[10px] mt-0.5 opacity-80">{fee}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-[#777777] leading-relaxed">
        {value === "XLM"
          ? "XLM will be used to cover Stellar network fees."
          : "A small USDC amount will be deducted to cover network fees."}
      </p>
    </div>
  );
}

function formatPayout(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return "—";
  if (currency.toUpperCase() === "NGN") {
    return `₦${new Intl.NumberFormat("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)}`;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency.toUpperCase()} ${num.toFixed(2)}`;
  }
}

interface PayoutBoxProps {
  quote: QuoteResult;
  currency: string;
}

function PayoutBox({ quote, currency }: PayoutBoxProps) {
  return (
    <div className="border border-[#c9a962]/30 bg-[#c9a962]/5 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] tracking-[0.18em] text-[#777777] uppercase">Estimated Payout</span>
        <span className="text-[10px] text-[#777777]">
          Rate: {currency.toUpperCase() === "NGN"
            ? `₦${new Intl.NumberFormat("en-NG").format(quote.rate)}`
            : quote.rate.toFixed(4)} / USDC
        </span>
      </div>
      <span className="font-space-grotesk font-bold text-[#c9a962] text-lg tabular-nums">
        {formatPayout(quote.destinationAmount, currency)}
      </span>
    </div>
  );
}

type CtaState = "disconnected" | "connecting" | "ready" | "submitting" | "invalid";

function getCtaLabel(state: CtaState): string {
  switch (state) {
    case "disconnected": return "CONNECT WALLET";
    case "connecting":   return "WAITING FOR SIGNATURE...";
    case "submitting":   return "INITIATING OFFRAMP...";
    case "invalid":      return "INITIATE OFFRAMP →";
    case "ready":        return "INITIATE OFFRAMP →";
  }
}

function getCtaDisabled(state: CtaState): boolean {
  return state === "connecting" || state === "submitting" || state === "invalid";
}

export default function FormCard({
  isConnected,
  isConnecting,
  resetKey = 0,
  onConnect,
  onSubmit,
  onQuoteChange,
  onAmountChange,
  onCurrencyChange,
}: FormCardProps) {
  const [amount, setAmount] = useState("");
  const [feeMethod, setFeeMethod] = useState<FeeMethod>("USDC");
  const [currency, setCurrency] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [institution, setInstitution] = useState("");
  const [accountName, setAccountName] = useState("");

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [gasFees, setGasFees] = useState<GasFeeOptions | null>(null);

  const [isCurrenciesLoading, setIsCurrenciesLoading] = useState(false);
  const [isInstitutionsLoading, setIsInstitutionsLoading] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [isGasFeesLoading, setIsGasFeesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [amountError, setAmountError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [verifyError, setVerifyError] = useState("");

  const quoteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (resetKey === 0) return;
    setAmount("");
    setFeeMethod("USDC");
    setCurrency("");
    setAccountNumber("");
    setInstitution("");
    setAccountName("");
    setQuote(null);
    setAmountError("");
    setAccountError("");
    setQuoteError("");
    setVerifyError("");
  }, [resetKey]);

  // ---------------------------------------------------------------------------
  // Fetch currencies on mount
  // -----------------------------------------------------------------------------
  useEffect(() => {
    setIsCurrenciesLoading(true);
    fetch("/api/offramp/currencies")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCurrencies(data);
          // Default to NGN if available (per issue #70)
          const hasNGN = data.some((c: Currency) => c.code === 'NGN');
          if (hasNGN) {
            setCurrency('NGN');
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsCurrenciesLoading(false));
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch gas fee options on mount (per issue #69)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchGasFees = async () => {
      setIsGasFeesLoading(true);
      try {
        const res = await fetch('/api/offramp/bridge/gas-fee-options');
        const data = await res.json();
        setGasFees(data);
      } catch (error) {
        console.error('Failed to fetch gas fees:', error);
        setGasFees(null);
      } finally {
        setIsGasFeesLoading(false);
      }
    };
    fetchGasFees();
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch institutions when currency changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setIsCurrenciesLoading(true);
    fetch("/api/offramp/currencies")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCurrencies(data);
      })
      .catch(() => {})
      .finally(() => setIsCurrenciesLoading(false));
  }, []);

  useEffect(() => {
    if (!currency) {
      setInstitutions([]);
      setInstitution("");
      return;
    }
    setIsInstitutionsLoading(true);
    setInstitution("");
    setAccountName("");
    fetch(`/api/offramp/institutions/${currency}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInstitutions(data);
      })
      .catch(() => {})
      .finally(() => setIsInstitutionsLoading(false));
  }, [currency]);

  const fetchQuote = useCallback(
    (amt: string, cur: string, fee: FeeMethod) => {
      // Clear any pending debounce
      if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current);

      // Validate minimum inputs
      const num = parseFloat(amt);
      if (!amt || isNaN(num) || num < 0.7 || !cur) {
        setQuote(null);
        onQuoteChange?.(null);
        return;
      }

      // Debounce 500ms before fetching
      quoteDebounceRef.current = setTimeout(async () => {
        setIsQuoteLoading(true);
        setQuoteError("");
        try {
          // Call quote API endpoint
          const res = await fetch("/api/offramp/quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              amount: amt, 
              currency: cur, 
              feeMethod: fee 
            }),
          });

          const data = await res.json();
          
          if (!res.ok) {
            throw new Error(data.error || "Failed to fetch quote");
          }

          // Validate quote object - reject NaN or negative values
          if (!isValidQuote(data)) {
            throw new Error("Invalid quote received: NaN or negative values");
          }

          // Build quote result with currency
          const result: QuoteResult = { 
            ...data, 
            currency: cur 
          };

          // Update state and notify parent
          setQuote(result);
          onQuoteChange?.(result);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Could not fetch quote";
          if (!msg.includes("Not implemented")) setQuoteError(msg);
          setQuote(null);
          onQuoteChange?.(null);
        } finally {
          setIsQuoteLoading(false);
        }
      }, 500);
    },
    [onQuoteChange]
  );

  const verifyAccount = useCallback(
    (accNum: string, inst: string, cur: string) => {
      if (verifyDebounceRef.current) clearTimeout(verifyDebounceRef.current);

      if (!validateAccountNumber(accNum) || !inst || !cur) {
        setAccountName("");
        return;
      }

      verifyDebounceRef.current = setTimeout(async () => {
        setIsVerifyingAccount(true);
        setVerifyError("");
        setAccountName("");
        try {
          const res = await fetch("/api/offramp/verify-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ institution: inst, accountIdentifier: accNum, currency: cur }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Verification failed");
          setAccountName(data.accountName ?? "");
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Could not verify account";
          setVerifyError(msg);
        } finally {
          setIsVerifyingAccount(false);
        }
      }, 400);
    },
    []
  );

  function handleAmountChange(val: string) {
    setAmount(val);
    onAmountChange?.(val);
    const num = parseFloat(val);
    if (val && (isNaN(num) || num < 0.7)) {
      setAmountError("Minimum amount is 0.7 USDC");
    } else {
      setAmountError("");
    }
    fetchQuote(val, currency, feeMethod);
  }

  function handleCurrencyChange(val: string) {
    setCurrency(val);
    onCurrencyChange?.(val);
    fetchQuote(amount, val, feeMethod);
  }

  function handleFeeMethodChange(val: FeeMethod) {
    setFeeMethod(val);
    fetchQuote(amount, currency, val);
  }

  function handleAccountNumberChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setAccountNumber(digits);
    setAccountError(digits.length > 0 && digits.length < 10 ? "Account number must be 10 digits" : "");
    verifyAccount(digits, institution, currency);
  }

  function handleInstitutionChange(val: string) {
    setInstitution(val);
    setAccountName("");
    verifyAccount(accountNumber, val, currency);
  }

  const isFormValid =
    isConnected &&
    validateAmount(amount) &&
    parseFloat(amount) >= 0.7 &&
    !!currency &&
    !!institution &&
    validateAccountNumber(accountNumber) &&
    !!accountName &&
    !!quote &&
    !amountError &&
    !accountError;

  function getCtaState(): CtaState {
    if (!isConnected && !isConnecting) return "disconnected";
    if (isConnecting) return "connecting";
    if (isSubmitting) return "submitting";
    if (!isFormValid) return "invalid";
    return "ready";
  }

  const ctaState = getCtaState();

  async function handleSubmitForm() {
    if (!isFormValid || !quote) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        amount,
        currency,
        institution,
        accountIdentifier: accountNumber,
        accountName,
        feeMethod,
        quote,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#111111] border border-[#333333] p-6 flex flex-col gap-6">
        <InputField
          label="Amount (USDC)"
          id="amount"
          value={amount}
          onChange={handleAmountChange}
          type="number"
          placeholder="0.00"
          suffix={isQuoteLoading ? "..." : "USDC"}
          error={amountError || quoteError}
          disabled={!isConnected || isSubmitting}
        />

        <FeeMethodSelector
          value={feeMethod}
          onChange={handleFeeMethodChange}
          usdcFee={gasFees?.stablecoin?.float || null}
          xlmFee={gasFees?.native?.float || null}
          disabled={!isConnected}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Currency"
            id="currency"
            value={currency}
            options={currencies.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }))}
            onChange={handleCurrencyChange}
            loading={isCurrenciesLoading}
            disabled={!isConnected || isSubmitting}
          />
          <SelectField
            label="Bank / Institution"
            id="institution"
            value={institution}
            options={institutions.map((i) => ({ value: i.code, label: i.name }))}
            onChange={handleInstitutionChange}
            loading={isInstitutionsLoading}
            disabled={!currency || !isConnected || isSubmitting}
            placeholder={currency ? "Select bank..." : "Select currency first"}
          />
        </div>

        <InputField
          label="Account Number"
          id="accountNumber"
          value={accountNumber}
          onChange={handleAccountNumberChange}
          inputMode="numeric"
          placeholder="0000000000"
          error={accountError || verifyError}
          disabled={!institution || !isConnected || isSubmitting}
        />

        <Field label="Account Name" value={accountName} loading={isVerifyingAccount} />

        {quote && <PayoutBox quote={quote} currency={currency} />}

        <button
          onClick={ctaState === "disconnected" ? onConnect : handleSubmitForm}
          disabled={getCtaDisabled(ctaState)}
          className={cn(
            "w-full py-4 text-xs font-bold tracking-[0.2em] transition-all duration-200",
            ctaState === "ready"
              ? "bg-[#c9a962] text-black hover:bg-[#d4b982]"
              : "bg-[#222222] text-[#555555] cursor-not-allowed border border-[#333333]",
            (ctaState === "connecting" || ctaState === "submitting") && "animate-pulse"
          )}
        >
          {getCtaLabel(ctaState)}
        </button>
      </div>
    </div>
  );
}
