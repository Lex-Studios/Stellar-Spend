import { NextResponse } from 'next/server';

const PAYCREST_API_URL = process.env.PAYCREST_API_URL || 'https://api.paycrest.io/v1';

/**
 * GET /api/offramp/currencies
 * 
 * Fetches supported fiat currencies from Paycrest API.
 * Returns list of currencies with code, name, and symbol.
 */
export async function GET() {
  try {
    const apiKey = process.env.PAYCREST_API_KEY;
    
    if (!apiKey) {
      console.warn('PAYCREST_API_KEY not configured, returning default currencies');
      // Return default currencies as fallback
      return NextResponse.json([
        { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
        { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
        { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
      ]);
    }

    const response = await fetch(`${PAYCREST_API_URL}/currencies`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Paycrest API error (currencies):', response.status, error);
      // Return default currencies on error
      return NextResponse.json([
        { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
        { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
        { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
      ]);
    }

    const data = await response.json();
    
    // Transform Paycrest response to our format
    // Expected format: { currencies: [{ code, name, symbol, ... }] }
    const currencies = Array.isArray(data) 
      ? data.map((c: { code?: string; currency?: string; name?: string; symbol?: string }) => ({
          code: c.code || c.currency || '',
          name: c.name || '',
          symbol: c.symbol || '',
        }))
      : data.currencies?.map((c: { code?: string; currency?: string; name?: string; symbol?: string }) => ({
          code: c.code || c.currency || '',
          name: c.name || '',
          symbol: c.symbol || '',
        })) || [];

    return NextResponse.json(currencies);
  } catch (error) {
    console.error('Error fetching currencies from Paycrest:', error);
    // Return default currencies on exception
    return NextResponse.json([
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
      { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
      { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    ]);
  }
}
