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

export function isValidQuote(quote: unknown): boolean {
  if (!quote || typeof quote !== 'object') return false;
  
  const q = quote as Record<string, unknown>;
  const destAmount = parseFloat(String(q.destinationAmount ?? ''));
  const rate = typeof q.rate === 'number' ? q.rate : 0;
  
  return (
    !isNaN(destAmount) &&
    isFinite(destAmount) &&
    destAmount > 0 &&
    !isNaN(rate) &&
    isFinite(rate) &&
    rate > 0
  );
}
