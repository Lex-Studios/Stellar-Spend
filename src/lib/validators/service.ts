import { z } from "zod";
import {
  amountSchema,
  minAmountSchema,
  maxAmountSchema,
  amountRangeSchema,
  stellarAddressSchema,
  baseAddressSchema,
  evmAddressSchema,
  currencyCodeSchema,
  accountNumberSchema,
  institutionSchema,
  beneficiarySchema,
  quoteRequestSchema,
  bridgeTransactionSchema,
  payoutOrderSchema,
  offrampRequestSchema,
  formatZodErrors,
  FormattedValidationError,
} from "./schemas";

/**
 * Centralized validation service for all application validations
 */
export class ValidationService {
  /**
   * Validate amount
   */
  static validateAmount(amount: string): {
    valid: boolean;
    errors?: FormattedValidationError[];
  } {
    try {
      amountSchema.parse(amount);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "amount", message: "Invalid amount" }],
      };
    }
  }

  /**
   * Validate amount with minimum
   */
  static validateMinAmount(
    amount: string,
    min: number,
  ): { valid: boolean; errors?: FormattedValidationError[] } {
    try {
      minAmountSchema(min).parse(amount);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "amount", message: "Invalid amount" }],
      };
    }
  }

  /**
   * Validate amount with maximum
   */
  static validateMaxAmount(
    amount: string,
    max: number,
  ): { valid: boolean; errors?: FormattedValidationError[] } {
    try {
      maxAmountSchema(max).parse(amount);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "amount", message: "Invalid amount" }],
      };
    }
  }

  /**
   * Validate amount within range
   */
  static validateAmountRange(
    amount: string,
    min: number,
    max: number,
  ): { valid: boolean; errors?: FormattedValidationError[] } {
    try {
      amountRangeSchema(min, max).parse(amount);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "amount", message: "Invalid amount" }],
      };
    }
  }

  /**
   * Validate Stellar address
   */
  static validateStellarAddress(address: string): {
    valid: boolean;
    errors?: FormattedValidationError[];
  } {
    try {
      stellarAddressSchema.parse(address);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "address", message: "Invalid Stellar address" }],
      };
    }
  }

  /**
   * Validate Base address
   */
  static validateBaseAddress(address: string): {
    valid: boolean;
    errors?: FormattedValidationError[];
  } {
    try {
      baseAddressSchema.parse(address);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "address", message: "Invalid Base address" }],
      };
    }
  }

  /**
   * Validate EVM address
   */
  static validateEvmAddress(address: string): {
    valid: boolean;
    errors?: FormattedValidationError[];
  } {
    try {
      evmAddressSchema.parse(address);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "address", message: "Invalid EVM address" }],
      };
    }
  }

  /**
   * Validate currency code
   */
  static validateCurrencyCode(code: string): {
    valid: boolean;
    errors?: FormattedValidationError[];
  } {
    try {
      currencyCodeSchema.parse(code);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "currency", message: "Invalid currency code" }],
      };
    }
  }

  /**
   * Validate account number
   */
  static validateAccountNumber(accountNumber: string): {
    valid: boolean;
    errors?: FormattedValidationError[];
  } {
    try {
      accountNumberSchema.parse(accountNumber);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "accountNumber", message: "Invalid account number" }],
      };
    }
  }

  /**
   * Validate institution
   */
  static validateInstitution(institution: string): {
    valid: boolean;
    errors?: FormattedValidationError[];
  } {
    try {
      institutionSchema.parse(institution);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "institution", message: "Invalid institution" }],
      };
    }
  }

  /**
   * Validate beneficiary data
   */
  static validateBeneficiary(data: unknown): {
    valid: boolean;
    data?: any;
    errors?: FormattedValidationError[];
  } {
    try {
      const validated = beneficiarySchema.parse(data);
      return { valid: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "beneficiary", message: "Invalid beneficiary data" }],
      };
    }
  }

  /**
   * Validate quote request
   */
  static validateQuoteRequest(data: unknown): {
    valid: boolean;
    data?: any;
    errors?: FormattedValidationError[];
  } {
    try {
      const validated = quoteRequestSchema.parse(data);
      return { valid: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "request", message: "Invalid quote request" }],
      };
    }
  }

  /**
   * Validate bridge transaction
   */
  static validateBridgeTransaction(data: unknown): {
    valid: boolean;
    data?: any;
    errors?: FormattedValidationError[];
  } {
    try {
      const validated = bridgeTransactionSchema.parse(data);
      return { valid: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [
          { field: "transaction", message: "Invalid bridge transaction" },
        ],
      };
    }
  }

  /**
   * Validate payout order
   */
  static validatePayoutOrder(data: unknown): {
    valid: boolean;
    data?: any;
    errors?: FormattedValidationError[];
  } {
    try {
      const validated = payoutOrderSchema.parse(data);
      return { valid: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "order", message: "Invalid payout order" }],
      };
    }
  }

  /**
   * Validate offramp request
   */
  static validateOfframpRequest(data: unknown): {
    valid: boolean;
    data?: any;
    errors?: FormattedValidationError[];
  } {
    try {
      const validated = offrampRequestSchema.parse(data);
      return { valid: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: formatZodErrors(error) };
      }
      return {
        valid: false,
        errors: [{ field: "request", message: "Invalid offramp request" }],
      };
    }
  }
}
