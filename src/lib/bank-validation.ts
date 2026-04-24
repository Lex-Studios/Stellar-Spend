/**
 * Bank account validation utilities.
 * Supports: account number (generic), US routing number (ABA), IBAN.
 */

export type ValidationResult = { valid: boolean; error?: string };

/** Generic account number: 4–20 digits */
export function validateAccountNumber(value: string): ValidationResult {
  const digits = value.replace(/\s/g, "");
  if (!digits) return { valid: false, error: "Account number is required." };
  if (!/^\d+$/.test(digits)) return { valid: false, error: "Account number must contain only digits." };
  if (digits.length < 4) return { valid: false, error: "Account number is too short (min 4 digits)." };
  if (digits.length > 20) return { valid: false, error: "Account number is too long (max 20 digits)." };
  return { valid: true };
}

/** US ABA routing number: 9 digits with checksum */
export function validateRoutingNumber(value: string): ValidationResult {
  const digits = value.replace(/\s/g, "");
  if (!digits) return { valid: false, error: "Routing number is required." };
  if (!/^\d{9}$/.test(digits)) return { valid: false, error: "Routing number must be exactly 9 digits." };

  // ABA checksum: 3*(d0+d3+d6) + 7*(d1+d4+d7) + (d2+d5+d8) must be divisible by 10
  const d = digits.split("").map(Number);
  const sum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
  if (sum % 10 !== 0) return { valid: false, error: "Invalid routing number (checksum failed)." };
  return { valid: true };
}

/** IBAN: country code + check digits + BBAN, validated via MOD-97 */
export function validateIBAN(value: string): ValidationResult {
  const iban = value.replace(/\s/g, "").toUpperCase();
  if (!iban) return { valid: false, error: "IBAN is required." };
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(iban)) {
    return { valid: false, error: "IBAN format is invalid. Expected: CC##BBAN (e.g. GB29NWBK60161331926819)." };
  }
  // MOD-97 check
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const ch of numeric) {
    remainder = (remainder * 10 + parseInt(ch, 10)) % 97;
  }
  if (remainder !== 1) return { valid: false, error: "IBAN check digits are invalid." };
  return { valid: true };
}

export type BankFieldType = "account" | "routing" | "iban";

export function validateBankField(type: BankFieldType, value: string): ValidationResult {
  switch (type) {
    case "account": return validateAccountNumber(value);
    case "routing": return validateRoutingNumber(value);
    case "iban": return validateIBAN(value);
  }
}
