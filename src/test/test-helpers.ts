import type { Transaction } from "@/lib/transaction-storage";

/**
 * Factory for creating test transactions with sensible defaults
 */
export function createTestTransaction(
  overrides?: Partial<Transaction>,
): Transaction {
  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    userAddress: "GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDE",
    amount: "100.00",
    currency: "USDC",
    beneficiary: {
      institution: "Test Bank",
      accountIdentifier: "1234567890",
      accountName: "Test User",
      currency: "USD",
    },
    status: "pending",
    ...overrides,
  };
}

/**
 * Factory for creating valid Stellar addresses (G-key format)
 */
export function createValidStellarAddress(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let address = "G";
  for (let i = 0; i < 55; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

/**
 * Factory for creating valid Base addresses (0x format)
 */
export function createValidBaseAddress(): string {
  const chars = "0123456789abcdef";
  let address = "0x";
  for (let i = 0; i < 40; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

/**
 * Mock localStorage for testing
 */
export function createLocalStorageMock() {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
}

// ============================================================================
// QUOTE FACTORY
// ============================================================================

export interface QuoteResponse {
  destinationAmount: string;
  rate: number;
  currency: string;
  bridgeFee: string;
  payoutFee: string;
  estimatedTime: number;
}

export function createQuoteFactory() {
  return {
    create(overrides?: Partial<QuoteResponse>): QuoteResponse {
      return {
        destinationAmount: "158202.00",
        rate: 1598,
        currency: "NGN",
        bridgeFee: "0.5",
        payoutFee: "0",
        estimatedTime: 300,
        ...overrides,
      };
    },
    withCurrency(currency: string, rate: number): QuoteResponse {
      return this.create({ currency, rate });
    },
    withAmount(destinationAmount: string): QuoteResponse {
      return this.create({ destinationAmount });
    },
  };
}

// ============================================================================
// BENEFICIARY FACTORY
// ============================================================================

export interface Beneficiary {
  institution: string;
  accountIdentifier: string;
  accountName: string;
  currency: string;
}

export function createBeneficiaryFactory() {
  return {
    create(overrides?: Partial<Beneficiary>): Beneficiary {
      return {
        institution: "Test Bank",
        accountIdentifier: "1234567890",
        accountName: "Test User",
        currency: "NGN",
        ...overrides,
      };
    },
    withCurrency(currency: string): Beneficiary {
      return this.create({ currency });
    },
    withInstitution(institution: string): Beneficiary {
      return this.create({ institution });
    },
  };
}

// ============================================================================
// API RESPONSE FACTORY
// ============================================================================

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export function createApiResponseFactory() {
  return {
    success<T>(data: T, meta?: Record<string, unknown>): ApiSuccessResponse<T> {
      return { data, meta };
    },
    error(
      message: string,
      code?: string,
      details?: Record<string, unknown>,
    ): ApiErrorResponse {
      return { error: message, code, details };
    },
    validationError(field: string, message: string): ApiErrorResponse {
      return this.error(`Validation failed: ${field}`, "VALIDATION_ERROR", {
        field,
        message,
      });
    },
    notFound(resource: string): ApiErrorResponse {
      return this.error(`${resource} not found`, "NOT_FOUND");
    },
    unauthorized(): ApiErrorResponse {
      return this.error("Unauthorized", "UNAUTHORIZED");
    },
  };
}

// ============================================================================
// TRANSACTION FACTORY WITH TRAITS
// ============================================================================

export interface TransactionFactoryTraits {
  pending?: boolean;
  completed?: boolean;
  failed?: boolean;
  withBridge?: boolean;
  withPayout?: boolean;
}

export function createTransactionFactory() {
  return {
    create(overrides?: Partial<Transaction>): Transaction {
      return createTestTransaction(overrides);
    },
    withTraits(traits: TransactionFactoryTraits): Transaction {
      let status: Transaction["status"] = "pending";
      if (traits.completed) status = "completed";
      if (traits.failed) status = "failed";

      return this.create({
        status,
        bridgeStatus: traits.withBridge ? "completed" : undefined,
        payoutStatus: traits.withPayout ? "settled" : undefined,
      });
    },
    pending(): Transaction {
      return this.withTraits({ pending: true });
    },
    completed(): Transaction {
      return this.withTraits({
        completed: true,
        withBridge: true,
        withPayout: true,
      });
    },
    failed(): Transaction {
      return this.withTraits({ failed: true });
    },
  };
}

// ============================================================================
// USER DATA FACTORY
// ============================================================================

export interface UserData {
  id: string;
  address: string;
  email?: string;
  createdAt: number;
}

export function createUserDataFactory() {
  return {
    create(overrides?: Partial<UserData>): UserData {
      return {
        id: `user_${Math.random().toString(36).substr(2, 9)}`,
        address: createValidStellarAddress(),
        email: `test_${Date.now()}@example.com`,
        createdAt: Date.now(),
        ...overrides,
      };
    },
    withAddress(address: string): UserData {
      return this.create({ address });
    },
  };
}
