import { isValidQuote } from './validation';
import { withPaycrestTimeout } from './timeout';

export interface QuoteParams {
  amount: string;
  currency: string;
  feeMethod: 'native' | 'stablecoin';
  receiveAmount?: string;
}

export interface QuoteResult {
  destinationAmount: string;
  rate: number;
  currency: string;
  bridgeFee: string;
  payoutFee: string;
  estimatedTime: number;
}

/**
 * Fetch quote from Paycrest API
 * Handles rate fetching and destination amount calculation
 * 
 * @param receiveAmount - Amount received from bridge (in USDC)
 * @param currency - Target currency code (e.g., 'NGN', 'KES')
 * @returns Rate and destination amount with 1% platform fee applied
 */
export async function fetchPaycrestQuote(
  receiveAmount: string,
  currency: string
): Promise<{ rate: number; destinationAmount: string }> {
  if (!receiveAmount || !currency) {
    throw new Error('receiveAmount and currency are required');
  }

  const numAmount = parseFloat(receiveAmount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Invalid receiveAmount');
  }

  // Build Paycrest API URL: GET /v1/rates/USDC/{receiveAmount}/{currency}?network=base
  const url = new URL('https://api.paycrest.io/v1/rates/USDC');
  url.pathname = `/v1/rates/USDC/${receiveAmount}/${currency}`;
  url.searchParams.set('network', 'base');

  const response = await withPaycrestTimeout(
    fetch(url.toString()),
    'rate_quote'
  );
  if (!response.ok) {
    throw new Error(`Paycrest API error: ${response.statusText}`);
  }

  const data = await response.json();
  const rate = parseFloat(data.rate ?? '0');

  if (isNaN(rate) || rate <= 0) {
    throw new Error('Invalid rate received from Paycrest');
  }

  // Calculate destination amount with 1% platform fee: receiveAmount * rate * 0.99
  const destinationAmount = (numAmount * rate * 0.99).toString();

  return { rate, destinationAmount };
}

/**
 * Build and validate quote object
 * 
 * @throws Error if quote contains NaN or negative values
 */
export function buildQuote(
  destinationAmount: string,
  rate: number,
  currency: string,
  bridgeFee: string = '0',
  payoutFee: string = '0',
  estimatedTime: number = 300
): QuoteResult {
  const quote: QuoteResult = {
    destinationAmount,
    rate,
    currency,
    bridgeFee,
    payoutFee,
    estimatedTime,
  };

  if (!isValidQuote(quote)) {
    throw new Error('Invalid quote: NaN or negative values detected');
  }

  return quote;
}

/**
 * Calculate amount to send to bridge based on fee method
 * If stablecoin fee: subtract stablecoin fee from amount before quoting
 * 
 * @param amount - Original amount in USDC
 * @param feeMethod - 'native' (XLM) or 'stablecoin' (USDC)
 * @param stablecoinFee - Fee amount if using stablecoin method
 * @returns Amount to send to bridge
 */
export function calculateBridgeAmount(
  amount: string,
  feeMethod: 'native' | 'stablecoin',
  stablecoinFee: string = '0'
): string {
  const baseAmount = parseFloat(amount);
  
  if (isNaN(baseAmount) || baseAmount <= 0) {
    throw new Error('Invalid amount');
  }
  
  if (feeMethod === 'stablecoin') {
    const fee = parseFloat(stablecoinFee);
    const adjusted = baseAmount - fee;
    
    if (adjusted <= 0) {
      throw new Error('Amount is less than stablecoin fee');
    }
    
    return adjusted.toString();
  }
  
  return amount;
}
