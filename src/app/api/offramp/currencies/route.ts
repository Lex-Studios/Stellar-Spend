import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { ErrorHandler } from '@/lib/error-handler';

export const maxDuration = 10;

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

class PaycrestAdapter {
  private apiKey: string;
  private apiUrl = 'https://api.paycrest.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getCurrencies(): Promise<Currency[]> {
    const response = await fetch(`${this.apiUrl}/currencies`, {
      headers: {
        'Content-Type': 'application/json',
        'API-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch currencies: ${response.status}`);
    }

    const data = await response.json();

    // Transform Paycrest response to our format
    const currencies = Array.isArray(data)
      ? data.map((c: any) => ({
        code: c.code || c.currency || '',
        name: c.name || '',
        symbol: c.symbol || '',
      }))
      : data.currencies?.map((c: any) => ({
        code: c.code || c.currency || '',
        name: c.name || '',
        symbol: c.symbol || '',
      })) || [];

    return currencies;
  }
}

// In-memory cache for currencies
let cachedCurrencies: Currency[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/offramp/currencies
 * 
 * Fetches supported fiat currencies from Paycrest API.
 * Returns list of currencies with code, name, and symbol.
 * Caches result for 5 minutes.
 */
export async function GET() {
  try {
    // Check cache
    const now = Date.now();
    if (cachedCurrencies && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(
        { data: cachedCurrencies },
        {
          headers: { 'Cache-Control': 'public, max-age=300' },
        }
      );
    }

    // Instantiate PaycrestAdapter
    const paycrest = new PaycrestAdapter(env.server.PAYCREST_API_KEY);

    // Get currencies
    const currencies = await paycrest.getCurrencies();

    // Cache the result
    cachedCurrencies = currencies;
    cacheTimestamp = now;

    return NextResponse.json(
      { data: currencies },
      {
        headers: { 'Cache-Control': 'public, max-age=300' },
      }
    );
  } catch (error) {
    console.error('Error fetching currencies from Paycrest:', error);
    return ErrorHandler.handle(error);
  }
}
