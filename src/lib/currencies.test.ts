import { describe, it, expect } from "vitest";
import {
  getActiveCurrencies,
  getCurrencyConfig,
  isSupportedCurrency,
  validateCurrencyAmount,
  SUPPORTED_CURRENCIES,
} from "./currencies";

describe("SUPPORTED_CURRENCIES", () => {
  it("contains at least 10 currencies", () => {
    expect(SUPPORTED_CURRENCIES.length).toBeGreaterThanOrEqual(10);
  });

  it("all entries have required fields", () => {
    for (const c of SUPPORTED_CURRENCIES) {
      expect(c.code).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.symbol).toBeTruthy();
      expect(typeof c.decimals).toBe("number");
      expect(c.minAmount).toBeGreaterThan(0);
      expect(c.maxAmount).toBeGreaterThan(c.minAmount);
    }
  });
});

describe("getActiveCurrencies", () => {
  it("returns only active currencies", () => {
    const active = getActiveCurrencies();
    expect(active.every((c) => c.active)).toBe(true);
    expect(active.length).toBeGreaterThan(0);
  });
});

describe("getCurrencyConfig", () => {
  it("returns config for known currency", () => {
    const config = getCurrencyConfig("NGN");
    expect(config).toBeDefined();
    expect(config?.code).toBe("NGN");
  });

  it("is case-insensitive", () => {
    expect(getCurrencyConfig("ngn")).toBeDefined();
    expect(getCurrencyConfig("KES")).toBeDefined();
  });

  it("returns undefined for unknown currency", () => {
    expect(getCurrencyConfig("XYZ")).toBeUndefined();
  });
});

describe("isSupportedCurrency", () => {
  it("returns true for active currencies", () => {
    expect(isSupportedCurrency("NGN")).toBe(true);
    expect(isSupportedCurrency("KES")).toBe(true);
  });

  it("returns false for inactive currencies", () => {
    const inactive = SUPPORTED_CURRENCIES.find((c) => !c.active);
    if (inactive) {
      expect(isSupportedCurrency(inactive.code)).toBe(false);
    }
  });

  it("returns false for unknown currencies", () => {
    expect(isSupportedCurrency("XYZ")).toBe(false);
  });
});

describe("validateCurrencyAmount", () => {
  it("returns null for valid amount", () => {
    expect(validateCurrencyAmount("NGN", 1000)).toBeNull();
  });

  it("returns error for amount below minimum", () => {
    const config = getCurrencyConfig("NGN")!;
    const error = validateCurrencyAmount("NGN", config.minAmount - 1);
    expect(error).toMatch(/minimum/i);
  });

  it("returns error for amount above maximum", () => {
    const config = getCurrencyConfig("NGN")!;
    const error = validateCurrencyAmount("NGN", config.maxAmount + 1);
    expect(error).toMatch(/maximum/i);
  });

  it("returns error for unsupported currency", () => {
    const error = validateCurrencyAmount("XYZ", 100);
    expect(error).toMatch(/unsupported/i);
  });
});
