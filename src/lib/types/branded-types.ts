/**
 * Branded types for enhanced type safety
 */

// Branded ID types
export type UserId = string & { readonly __brand: "UserId" };
export type TransactionId = string & { readonly __brand: "TransactionId" };
export type ApiKeyId = string & { readonly __brand: "ApiKeyId" };
export type AuditLogId = string & { readonly __brand: "AuditLogId" };
export type OrderId = string & { readonly __brand: "OrderId" };

// Branded address types
export type StellarAddress = string & { readonly __brand: "StellarAddress" };
export type EthereumAddress = string & { readonly __brand: "EthereumAddress" };
export type BankAccountNumber = string & {
  readonly __brand: "BankAccountNumber";
};

// Branded amount types
export type Amount = string & { readonly __brand: "Amount" };
export type Percentage = number & { readonly __brand: "Percentage" };

// Factory functions
export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createTransactionId(id: string): TransactionId {
  return id as TransactionId;
}

export function createApiKeyId(id: string): ApiKeyId {
  return id as ApiKeyId;
}

export function createAuditLogId(id: string): AuditLogId {
  return id as AuditLogId;
}

export function createOrderId(id: string): OrderId {
  return id as OrderId;
}

export function createStellarAddress(address: string): StellarAddress {
  if (!address.startsWith("G") || address.length !== 56) {
    throw new Error("Invalid Stellar address");
  }
  return address as StellarAddress;
}

export function createEthereumAddress(address: string): EthereumAddress {
  if (!address.startsWith("0x") || address.length !== 42) {
    throw new Error("Invalid Ethereum address");
  }
  return address as EthereumAddress;
}

export function createAmount(amount: string): Amount {
  const num = parseFloat(amount);
  if (isNaN(num) || num < 0) {
    throw new Error("Invalid amount");
  }
  return amount as Amount;
}

export function createPercentage(value: number): Percentage {
  if (value < 0 || value > 100) {
    throw new Error("Percentage must be between 0 and 100");
  }
  return value as Percentage;
}
