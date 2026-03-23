export function validateAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

export function validateAddress(address: string, chain: 'stellar' | 'base'): boolean {
  if (!address) return false;
  if (chain === 'stellar') return /^G[A-Z0-9]{55}$/.test(address);
  if (chain === 'base') return /^0x[a-fA-F0-9]{40}$/.test(address);
  return false;
}

export function validateAccountNumber(accountNumber: string): boolean {
  return /^\d{10}$/.test(accountNumber);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[^\w\s.-]/g, '');
}

export function validateToken(token: string): boolean {
  return ['USDC', 'USDT'].includes(token.toUpperCase());
}
