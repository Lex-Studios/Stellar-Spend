import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FormCard, type FormCardProps } from "@/components/FormCard";

const noop = vi.fn();

const baseProps: FormCardProps = {
  amount: "",
  currency: "",
  bank: "",
  accountNumber: "",
  accountName: "",
  feeMethod: "native",
  currencies: [{ value: "NGN", label: "Nigerian Naira (NGN)" }],
  banks: [{ value: "ACCESS", label: "Access Bank" }],
  feeOptions: [
    { label: "XLM", method: "native", amount: "~0.001 XLM" },
    { label: "USDC", method: "stablecoin", amount: "~0.50 USDC" },
  ],
  isConnected: false,
  isConnecting: false,
  onAmountChange: noop,
  onCurrencyChange: noop,
  onBankChange: noop,
  onAccountNumberChange: noop,
  onFeeMethodChange: noop,
  onSubmit: noop,
};

// ── Currency dropdown ──────────────────────────────────────────────────────────

describe("FormCard — currency dropdown skeleton", () => {
  it("renders skeleton while isLoadingCurrencies=true", () => {
    render(<FormCard {...baseProps} isLoadingCurrencies />);
    const statuses = screen.getAllByRole("status");
    const currencySkeletons = statuses.filter((s) =>
      s.getAttribute("aria-label")?.toLowerCase().includes("currency")
    );
    expect(currencySkeletons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders select when not loading", () => {
    render(<FormCard {...baseProps} isLoadingCurrencies={false} />);
    expect(screen.getByLabelText(/CURRENCY/i)).toBeInTheDocument();
  });

  it("no skeleton present when not loading", () => {
    render(<FormCard {...baseProps} isLoadingCurrencies={false} />);
    const statuses = screen.queryAllByRole("status");
    const currencySkeletons = statuses.filter((s) =>
      s.getAttribute("aria-label")?.toLowerCase().includes("currency")
    );
    expect(currencySkeletons.length).toBe(0);
  });
});

// ── Bank dropdown ──────────────────────────────────────────────────────────────

describe("FormCard — bank dropdown skeleton", () => {
  it("renders skeleton while isLoadingBanks=true", () => {
    render(<FormCard {...baseProps} isLoadingBanks />);
    const statuses = screen.getAllByRole("status");
    const bankSkeletons = statuses.filter((s) =>
      s.getAttribute("aria-label")?.toLowerCase().includes("bank")
    );
    expect(bankSkeletons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders select when not loading", () => {
    render(<FormCard {...baseProps} isLoadingBanks={false} />);
    expect(screen.getByLabelText(/BANK/i)).toBeInTheDocument();
  });
});

// ── Quote suffix ───────────────────────────────────────────────────────────────

describe("FormCard — quote suffix skeleton", () => {
  it("renders skeleton in amount input while isLoadingQuote=true", () => {
    render(<FormCard {...baseProps} isLoadingQuote />);
    const statuses = screen.getAllByRole("status");
    const quoteSkeletons = statuses.filter((s) =>
      s.getAttribute("aria-label")?.toLowerCase().includes("quote")
    );
    expect(quoteSkeletons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders suffix text when loaded", () => {
    render(<FormCard {...baseProps} isLoadingQuote={false} quoteSuffix="≈ ₦799,000" />);
    expect(screen.getByText("≈ ₦799,000")).toBeInTheDocument();
    const statuses = screen.queryAllByRole("status");
    const quoteSkeletons = statuses.filter((s) =>
      s.getAttribute("aria-label")?.toLowerCase().includes("quote")
    );
    expect(quoteSkeletons.length).toBe(0);
  });

  it("renders nothing in suffix slot when not loading and no suffix", () => {
    render(<FormCard {...baseProps} isLoadingQuote={false} quoteSuffix={undefined} />);
    expect(screen.queryByText("≈")).not.toBeInTheDocument();
  });
});

// ── Gas fee options ────────────────────────────────────────────────────────────

describe("FormCard — gas fee skeleton", () => {
  it("renders two skeletons while isLoadingFees=true", () => {
    render(<FormCard {...baseProps} isLoadingFees />);
    const statuses = screen.getAllByRole("status");
    const feeSkeletons = statuses.filter((s) =>
      s.getAttribute("aria-label")?.toLowerCase().includes("fee")
    );
    expect(feeSkeletons.length).toBe(2);
  });

  it("renders fee buttons when not loading", () => {
    render(<FormCard {...baseProps} isLoadingFees={false} />);
    expect(screen.getByRole("button", { name: /XLM/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /USDC/i })).toBeInTheDocument();
  });

  it("fee buttons are not present while loading", () => {
    render(<FormCard {...baseProps} isLoadingFees />);
    // fee buttons should not be rendered
    const buttons = screen.queryAllByRole("button");
    const feeButtons = buttons.filter(
      (b) => b.textContent?.includes("XLM") || b.textContent?.includes("USDC")
    );
    expect(feeButtons.length).toBe(0);
  });
});

// ── Account name field ─────────────────────────────────────────────────────────

describe("FormCard — account name skeleton", () => {
  it("renders skeleton while isVerifyingAccount=true", () => {
    render(<FormCard {...baseProps} isVerifyingAccount />);
    const statuses = screen.getAllByRole("status");
    const verifySkeletons = statuses.filter((s) =>
      s.getAttribute("aria-label")?.toLowerCase().includes("verif")
    );
    expect(verifySkeletons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders account name when resolved", () => {
    render(<FormCard {...baseProps} isVerifyingAccount={false} accountName="John Doe" />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    const statuses = screen.queryAllByRole("status");
    const verifySkeletons = statuses.filter((s) =>
      s.getAttribute("aria-label")?.toLowerCase().includes("verif")
    );
    expect(verifySkeletons.length).toBe(0);
  });

  it("shows em-dash placeholder when not verifying and no name", () => {
    render(<FormCard {...baseProps} isVerifyingAccount={false} accountName="" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

// ── No layout shift ────────────────────────────────────────────────────────────

describe("FormCard — no layout shift", () => {
  it("form section is present in both loading and loaded states", () => {
    const { rerender } = render(
      <FormCard
        {...baseProps}
        isLoadingCurrencies
        isLoadingBanks
        isLoadingQuote
        isLoadingFees
        isVerifyingAccount
      />
    );
    const form = screen.getByRole("region", { name: "Offramp form" });
    expect(form).toBeInTheDocument();

    rerender(
      <FormCard
        {...baseProps}
        isLoadingCurrencies={false}
        isLoadingBanks={false}
        isLoadingQuote={false}
        isLoadingFees={false}
        isVerifyingAccount={false}
        currency="NGN"
        bank="ACCESS"
        accountName="Jane Doe"
        quoteSuffix="≈ ₦799,000"
      />
    );
    expect(screen.getByRole("region", { name: "Offramp form" })).toBeInTheDocument();
  });
});

// ── CTA button states ──────────────────────────────────────────────────────────

describe("FormCard — CTA button", () => {
  it("shows CONNECT WALLET when not connected", () => {
    render(<FormCard {...baseProps} isConnected={false} />);
    expect(screen.getByRole("button", { name: /CONNECT WALLET/i })).toBeDisabled();
  });

  it("shows INITIATE OFFRAMP when form is valid", () => {
    render(
      <FormCard
        {...baseProps}
        isConnected
        amount="100"
        currency="NGN"
        bank="ACCESS"
        accountNumber="1234567890"
        accountName="Jane Doe"
      />
    );
    expect(screen.getByRole("button", { name: /INITIATE OFFRAMP/i })).not.toBeDisabled();
  });
});
