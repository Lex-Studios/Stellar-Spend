import { describe, it, expect } from "vitest";
import { ValidationService } from "./service";

describe("ValidationService", () => {
  describe("Amount Validation", () => {
    it("should validate valid amounts", () => {
      const result = ValidationService.validateAmount("100.50");
      expect(result.valid).toBe(true);
    });

    it("should reject invalid amounts", () => {
      const result = ValidationService.validateAmount("abc");
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("should reject zero amount", () => {
      const result = ValidationService.validateAmount("0");
      expect(result.valid).toBe(false);
    });

    it("should validate min amount", () => {
      const result = ValidationService.validateMinAmount("100", 50);
      expect(result.valid).toBe(true);
    });

    it("should reject below min amount", () => {
      const result = ValidationService.validateMinAmount("30", 50);
      expect(result.valid).toBe(false);
    });

    it("should validate max amount", () => {
      const result = ValidationService.validateMaxAmount("100", 200);
      expect(result.valid).toBe(true);
    });

    it("should reject above max amount", () => {
      const result = ValidationService.validateMaxAmount("300", 200);
      expect(result.valid).toBe(false);
    });

    it("should validate amount range", () => {
      const result = ValidationService.validateAmountRange("100", 50, 200);
      expect(result.valid).toBe(true);
    });
  });

  describe("Address Validation", () => {
    it("should validate Stellar address", () => {
      const result = ValidationService.validateStellarAddress(
        "GCFX3NWMYLTOVSC3XVFVRID47IQ5LCLF34CM4A4ADIXZXWQGORNRIE25",
      );
      expect(result.valid).toBe(true);
    });

    it("should reject invalid Stellar address", () => {
      const result = ValidationService.validateStellarAddress("invalid");
      expect(result.valid).toBe(false);
    });

    it("should validate Base address", () => {
      const result = ValidationService.validateBaseAddress(
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37AA96045",
      );
      expect(result.valid).toBe(true);
    });

    it("should reject invalid Base address", () => {
      const result = ValidationService.validateBaseAddress("0xinvalid");
      expect(result.valid).toBe(false);
    });

    it("should validate EVM address", () => {
      const result = ValidationService.validateEvmAddress(
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37AA96045",
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("Currency Validation", () => {
    it("should validate currency code", () => {
      const result = ValidationService.validateCurrencyCode("NGN");
      expect(result.valid).toBe(true);
    });

    it("should reject invalid currency code", () => {
      const result = ValidationService.validateCurrencyCode("INVALID");
      expect(result.valid).toBe(false);
    });
  });

  describe("Beneficiary Validation", () => {
    it("should validate account number", () => {
      const result = ValidationService.validateAccountNumber("1234567890");
      expect(result.valid).toBe(true);
    });

    it("should reject invalid account number", () => {
      const result = ValidationService.validateAccountNumber("123");
      expect(result.valid).toBe(false);
    });

    it("should validate institution", () => {
      const result = ValidationService.validateInstitution("GTBank");
      expect(result.valid).toBe(true);
    });

    it("should validate complete beneficiary", () => {
      const result = ValidationService.validateBeneficiary({
        institution: "GTBank",
        accountIdentifier: "1234567890",
        currency: "NGN",
      });
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe("Request Validation", () => {
    it("should validate quote request", () => {
      const result = ValidationService.validateQuoteRequest({
        amount: "100",
        currency: "NGN",
        feeMethod: "USDC",
      });
      expect(result.valid).toBe(true);
    });

    it("should validate offramp request", () => {
      const result = ValidationService.validateOfframpRequest({
        amount: "100",
        currency: "NGN",
        beneficiary: {
          institution: "GTBank",
          accountIdentifier: "1234567890",
          currency: "NGN",
        },
        feeMethod: "USDC",
        fromAddress: "GCFX3NWMYLTOVSC3XVFVRID47IQ5LCLF34CM4A4ADIXZXWQGORNRIE25",
        toAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37AA96045",
      });
      expect(result.valid).toBe(true);
    });
  });
});
