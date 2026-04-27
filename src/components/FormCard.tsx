"use client";

import { cn } from "@/lib/cn";
import { validateAmount, validateAccountNumber, isValidQuote, validateEvmAddress } from "@/lib/offramp/utils/validation";
import { buildQuote, calculateBridgeAmount } from "@/lib/offramp/utils/quote-fetcher";
import { getCurrencyFlag } from "@/lib/currency-flags";
import { Skeleton } from "@/components/ui/Skeleton";
import { FormCardSkeleton } from "@/components/skeletons";
import { BankAccountInput, type BankMode } from "@/components/BankAccountInput";
import { QuoteComparison, type ProviderQuote } from "@/components/QuoteComparison";
import { Tooltip } from "@/components/Tooltip";
import { useFxRate } from "@/hooks/useFxRate";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeeOption {
  label: string;
  amount: string;
  method: "native" | "stablecoin";
}

export interface FormCardProps {
  // Controlled field values
  amount: string;
  currency: string;
  bank: string;
  accountNumber: string;
  accountName: string;
  feeMethod: "native" | "stablecoin";
  // Options
  currencies: Array<{ value: string; label: string }>;
  banks: Array<{ value: string; label: string }>;
  feeOptions: FeeOption[];
  // Loading states
  isLoadingCurrencies?: boolean;
  isLoadingBanks?: boolean;
  isLoadingQuote?: boolean;
  isLoadingFees?: boolean;
  isVerifyingAccount?: boolean;
  /** Show a full-form skeleton (e.g. on first mount before wallet is ready) */
  isInitialLoading?: boolean;
  // Quote display
  quoteSuffix?: string;
  // Wallet state
  isConnected: boolean;
  isConnecting: boolean;
  // Callbacks
  onAmountChange: (v: string) => void;
  onCurrencyChange: (v: string) => void;
  onBankChange: (v: string) => void;
  onAccountNumberChange: (v: string) => void;
  onFeeMethodChange: (v: "native" | "stablecoin") => void;
  onSubmit: () => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InputFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  min?: string;
  step?: string;
  maxLength?: number;
  disabled?: boolean;
  suffix?: string;
  error?: string;
  success?: string;
  touched?: boolean;
  inputMode?: "numeric" | "decimal" | "text";
  help?: string;
}

function InputField({
  label,
  id,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  min,
  step,
  maxLength,
  disabled,
  suffix,
  error,
  success,
  touched,
  inputMode,
  help,
}: InputFieldProps) {
  const showError = touched && error;
  const showSuccess = touched && !error && success && value;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-[10px] tracking-[0.18em] text-[#777777] uppercase">
          {label}
        </label>
        {help && (
          <Tooltip content={help} position="top">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-[#777777] hover:text-[#c9a962] cursor-help transition-colors"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </Tooltip>
        )}
      </div>
      <div className="relative flex items-center">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          min={min}
          step={step}
          maxLength={maxLength}
          disabled={disabled}
          inputMode={inputMode}
          aria-invalid={showError ? "true" : undefined}
          aria-describedby={showError ? `${id}-error` : showSuccess ? `${id}-success` : undefined}
          className={cn(
            "w-full bg-[#0a0a0a] border px-3 py-2.5 text-sm text-white placeholder-[#444444]",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "transition-colors duration-150",
            showError
              ? "border-red-500/60 focus:border-red-500/80"
              : showSuccess
              ? "border-green-500/50 focus:border-green-500/70"
              : "border-[#333333] focus:border-[#c9a962]",
            suffix && "pr-20"
          )}
        />
        {/* Validation state icon */}
        {!disabled && value && (
          <span className="absolute right-3 pointer-events-none select-none flex items-center">
            {suffix && !showError && !showSuccess && (
              <span className="text-xs text-[#777777]">{suffix}</span>
            )}
            {showError && (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-red-400" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 4.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="11" r="0.75" fill="currentColor" />
              </svg>
            )}
            {showSuccess && (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-green-400" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {!showError && !showSuccess && suffix && value && (
              <span className="sr-only">{suffix}</span>
            )}
          </span>
        )}
        {/* Suffix when no value or no validation state */}
        {suffix && !value && (
          <span className="absolute right-3 text-xs text-[#777777] pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
      {showError && (
        <span id={`${id}-error`} role="alert" className="flex items-center gap-1 text-[10px] text-red-400 tracking-wide">
          {error}
        </span>
      )}
      {showSuccess && (
        <span id={`${id}-success`} className="text-[10px] text-green-400 tracking-wide">
          {success}
        </span>
      )}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  touched?: boolean;
}

function SelectField({
  label,
  id,
  value,
  onChange,
  onBlur,
  options,
  placeholder = "Select...",
  disabled,
  loading,
  error,
  touched,
}: SelectFieldProps) {
  const showError = touched && error && !value;

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
          onBlur={onBlur}
          disabled={disabled || loading}
          aria-invalid={showError ? "true" : undefined}
          aria-describedby={showError ? `${id}-error` : undefined}
          className={cn(
            "w-full appearance-none bg-[#0a0a0a] border px-3 py-2.5 text-sm",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962] focus:border-[#c9a962]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "transition-colors duration-150",
            showError ? "border-red-500/60" : value ? "border-[#c9a962]/40" : "border-[#333333]",
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
      {showError && (
        <span id={`${id}-error`} role="alert" className="text-[10px] text-red-400 tracking-wide">
          {error}
        </span>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  loading?: boolean;
  placeholder?: string;
  success?: boolean;
}

function Field({ label, value, loading, placeholder = "—", success }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] tracking-[0.18em] text-[#777777] uppercase">{label}</span>
      <div className={cn(
        "bg-[#0a0a0a] border px-3 py-2.5 text-sm min-h-[42px] flex items-center justify-between",
        success && value ? "border-green-500/40" : "border-[#333333]"
      )}>
        <span>
          {loading ? (
            <span className="text-[#777777] text-xs tracking-wider">Resolving...</span>
          ) : value ? (
            <span className="text-[#c9a962]">{value}</span>
          ) : (
            <span className="text-[#444444]">{placeholder}</span>
          )}
        </span>
        {success && value && !loading && (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-green-400 shrink-0" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
                "flex-1 py-2.5 px-3 min-h-[44px] text-xs tracking-widest border transition-colors duration-150",
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

function formatPayout(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return "—";
  const symbol = getCurrencySymbol(currency);
  
  if (currency.toUpperCase() === "NGN") {
    return `${symbol}${new Intl.NumberFormat("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)}`;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${symbol} ${num.toFixed(2)}`;
  }
}

interface PayoutBoxProps {
  quote: QuoteResult;
  currency: string;
  liveRate?: number | null;
  flash?: boolean;
}

function PayoutBox({ quote, currency, liveRate, flash }: PayoutBoxProps) {
  const effectiveRate = liveRate ?? quote.rate;
  const amount = parseFloat(quote.destinationAmount);
  // Recalculate payout using live rate if available
  const liveDestination =
    liveRate && quote.rate > 0
      ? ((amount / quote.rate) * liveRate).toFixed(2)
      : quote.destinationAmount;

  return (
    <div className="border border-[#c9a962]/30 bg-[#c9a962]/5 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] tracking-[0.18em] text-[#777777] uppercase">Estimated Payout</span>
        <span className="text-[10px] text-[#777777]">
          Rate: {currency.toUpperCase() === "NGN"
            ? `${getCurrencySymbol(currency)}${new Intl.NumberFormat("en-NG").format(effectiveRate)}`
            : `${getCurrencySymbol(currency)} ${effectiveRate.toFixed(4)}`} / USDC
        </span>
      </div>
      <span
        className={cn(
          "font-space-grotesk font-bold text-lg tabular-nums transition-colors duration-300",
          flash ? "text-white" : "text-[#c9a962]"
        )}
      >
        {formatPayout(liveDestination, currency)}
      </span>
    </div>
  );
}

function buildProviderQuotes(quote: QuoteResult, currency: string): ProviderQuote[] {
  const base = parseFloat(quote.destinationAmount);
  const baseRate = quote.rate;
  const baseFee = parseFloat(quote.bridgeFee ?? "0.5");

  return [
    {
      id: "paycrest",
      provider: "Paycrest",
      rate: baseRate,
      bridgeFee: (baseFee).toFixed(2),
      payoutFee: "0.00",
      totalFee: baseFee.toFixed(2),
      estimatedTime: 300,
      destinationAmount: base.toFixed(2),
      currency,
      rating: 5,
      badge: "Best Rate",
    },
    {
      id: "yellowcard",
      provider: "Yellow Card",
      rate: Math.round(baseRate * 0.992),
      bridgeFee: (baseFee + 0.3).toFixed(2),
      payoutFee: "0.50",
      totalFee: (baseFee + 0.8).toFixed(2),
      estimatedTime: 180,
      destinationAmount: (base * 0.992).toFixed(2),
      currency,
      rating: 4,
      badge: "Fastest",
    },
    {
      id: "kotani",
      provider: "Kotani Pay",
      rate: Math.round(baseRate * 0.985),
      bridgeFee: (baseFee + 0.1).toFixed(2),
      payoutFee: "0.20",
      totalFee: (baseFee + 0.3).toFixed(2),
      estimatedTime: 420,
      destinationAmount: (base * 0.985).toFixed(2),
      currency,
      rating: 4,
      badge: "Lowest Fee",
    },
  ];
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

export function FormCard({
  amount,
  currency,
  bank,
  accountNumber,
  accountName,
  feeMethod,
  currencies,
  banks,
  feeOptions,
  isLoadingCurrencies,
  isLoadingBanks,
  isLoadingQuote,
  isLoadingFees,
  isVerifyingAccount,
  isInitialLoading,
  quoteSuffix,
  isConnected,
  isConnecting,
  onAmountChange,
  onCurrencyChange,
  onBankChange,
  onAccountNumberChange,
  onFeeMethodChange,
  onSubmit,
}: FormCardProps) {
  const [amount, setAmount] = useState("");
  const [feeMethod, setFeeMethod] = useState<FeeMethod>("USDC");
  const [currency, setCurrency] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankMode, setBankMode] = useState<BankMode>("local");
  const [routingNumber, setRoutingNumber] = useState("");
  const [iban, setIban] = useState("");
  const [institution, setInstitution] = useState("");
  const [accountName, setAccountName] = useState("");

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [gasFees, setGasFees] = useState<GasFeeOptions | null>(null);

  const { rate: liveRate, flash: rateFlash } = useFxRate();

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
  const [selectedProviderId, setSelectedProviderId] = useState<string>("paycrest");

  // Track which fields have been touched (blurred) for validation UX
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const touchField = (field: string) =>
    setTouchedFields((prev) => ({ ...prev, [field]: true }));

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
    setTouchedFields({});
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

  const ctaLabel = isConnecting
    ? "CONNECTING..."
    : !isConnected
    ? "CONNECT WALLET"
    : "INITIATE OFFRAMP →";

  const ctaDisabled =
    isConnecting ||
    !isConnected ||
    !amount ||
    !currency ||
    !bank ||
    !accountNumber ||
    !accountName;

  return (
    <div className="flex flex-col gap-6" onKeyDown={handleKeyDown}>
      <div className="bg-[#111111] border border-[#333333] p-6 flex flex-col gap-6">
        <InputField
          label="Amount (USDC)"
          id="amount"
          value={amount}
          onChange={handleAmountChange}
          onBlur={() => touchField("amount")}
          type="number"
          placeholder="0.00"
          suffix={isQuoteLoading ? "..." : "USDC"}
          error={amountError || quoteError}
          success={validateAmount(amount) && parseFloat(amount) >= 0.7 ? "Valid amount" : undefined}
          touched={touchedFields["amount"]}
          disabled={!isConnected || isSubmitting}
        />

      {/* Fee method */}
      <div className="flex flex-col gap-1.5">
        <Label>Gas Fee Method</Label>
        {isLoadingFees ? (
          <div className="flex gap-2">
            <Skeleton width="50%" height={44} aria-label="Loading fee option…" />
            <Skeleton width="50%" height={44} aria-label="Loading fee option…" />
          </div>
        ) : (
          <div className="flex gap-2">
            {feeOptions.map((opt) => (
              <button
                key={opt.method}
                type="button"
                aria-label={opt.label}
                onClick={() => onFeeMethodChange(opt.method)}
                disabled={!isConnected}
                className={cn(
                  "flex-1 py-2.5 px-3 text-xs tracking-widest border transition-colors duration-150",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  feeMethod === opt.method
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line bg-bg text-muted hover:border-accent/50"
                )}
              >
                <span className="block font-semibold">{opt.label}</span>
                <span className="block text-[10px] mt-0.5 opacity-80">{opt.amount}</span>
              </button>
            ))}
          </div>
        )}
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Currency"
            id="currency"
            value={currency}
            options={currencies.map((c) => {
              const flag = getCurrencyFlag(c.code);
              return { value: c.code, label: flag ? `${flag} ${c.name} (${c.code})` : `${c.name} (${c.code})` };
            })}
            onChange={handleCurrencyChange}
            onBlur={() => touchField("currency")}
            loading={isCurrenciesLoading}
            disabled={!isConnected || isSubmitting}
            error="Please select a currency"
            touched={touchedFields["currency"]}
          />
          <SelectField
            label="Bank / Institution"
            id="institution"
            value={institution}
            options={institutions.map((i) => ({ value: i.code, label: i.name }))}
            onChange={handleInstitutionChange}
            onBlur={() => touchField("institution")}
            loading={isInstitutionsLoading}
            disabled={!currency || !isConnected || isSubmitting}
            placeholder={currency ? "Select bank..." : "Select currency first"}
            error="Please select a bank"
            touched={touchedFields["institution"]}
          />
        </div>

        {/* Bank */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bank">Bank / Institution</Label>
          {isLoadingBanks ? (
            <Skeleton width="100%" height={42} aria-label="Loading bank options…" />
          ) : (
            <select
              id="bank"
              aria-label="BANK"
              value={bank}
              onChange={(e) => onBankChange(e.target.value)}
              disabled={!isConnected || !currency}
              className={cn(
                "w-full appearance-none bg-bg border border-line px-3 py-2.5 text-sm",
                "focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus:border-accent",
                "disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150",
                bank ? "text-text" : "text-[#444444]"
              )}
            >
              <option value="" disabled>{currency ? "Select bank..." : "Select currency first"}</option>
              {banks.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Account number */}
      <BankAccountInput
        mode={bankMode}
        onModeChange={setBankMode}
        accountNumber={accountNumber}
        onAccountNumberChange={(v) => {
          setAccountNumber(v);
          verifyAccount(v, institution, currency);
        }}
        routingNumber={routingNumber}
        onRoutingNumberChange={setRoutingNumber}
        iban={iban}
        onIbanChange={setIban}
        disabled={!institution || !isConnected || isSubmitting}
      />

        <Field label="Account Name" value={accountName} loading={isVerifyingAccount} success={!!accountName} />

        {quote && <PayoutBox quote={quote} currency={currency} liveRate={liveRate} flash={rateFlash} />}

        {quote && (
          <QuoteComparison
            quotes={buildProviderQuotes(quote, currency)}
            selectedId={selectedProviderId}
            onSelect={setSelectedProviderId}
            isLoading={isQuoteLoading}
          />
        )}

        <button
          onClick={ctaState === "disconnected" ? onConnect : handleSubmitForm}
          disabled={getCtaDisabled(ctaState)}
          aria-label={getCtaLabel(ctaState)}
          className={cn(
            "w-full py-4 min-h-[52px] text-xs font-bold tracking-[0.2em] transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a962] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]",
            ctaState === "ready"
              ? "bg-[#c9a962] text-black hover:bg-[#d4b982]"
              : "bg-[#222222] text-[#555555] cursor-not-allowed border border-[#333333]",
            (ctaState === "connecting" || ctaState === "submitting") && "animate-pulse"
          )}
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={ctaDisabled}
        aria-label={ctaLabel}
        className={cn(
          "w-full py-4 text-xs font-bold tracking-[0.2em] transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel",
          !ctaDisabled
            ? "bg-accent text-black hover:bg-[#d4b982]"
            : "bg-[#222222] text-[#555555] cursor-not-allowed border border-line",
          isConnecting && "animate-pulse"
        )}
      >
        {ctaLabel}
      </button>
    </section>
  );
}

export default FormCard;
