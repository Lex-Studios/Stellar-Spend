import { NextResponse } from 'next/server';

const PAYCREST_API_URL = process.env.PAYCREST_API_URL || 'https://api.paycrest.io/v1';

/**
 * GET /api/offramp/institutions/[currency]
 * 
 * Fetches available banks/institutions for a given currency from Paycrest API.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ currency: string }> }) {
  try {
    const { currency } = await params;
    const apiKey = process.env.PAYCREST_API_KEY;
    
    if (!apiKey) {
      console.warn('PAYCREST_API_KEY not configured, returning default institutions');
      // Return default Nigerian banks as fallback
      return NextResponse.json([
        { code: '044', name: 'Access Bank' },
        { code: '023', name: 'Citibank' },
        { code: '058', name: 'Diamond Bank' },
        { code: '070', name: 'Fidelity Bank' },
        { code: '011', name: 'First Bank of Nigeria' },
        { code: '214', name: 'First City Monument Bank' },
        { code: '058', name: 'Guaranty Trust Bank' },
        { code: '076', name: 'Heritage Bank' },
        { code: '082', name: 'Keystone Bank' },
        { code: '101', name: 'Oceanic Bank' },
        { code: '039', name: 'Stanbic IBTC Bank' },
        { code: '232', name: 'Sterling Bank' },
        { code: '068', name: 'United Bank for Africa' },
        { code: '032', name: 'Union Bank of Nigeria' },
        { code: '033', name: 'Unity Bank' },
        { code: '215', name: 'Unity Bank' },
        { code: '035', name: 'Wema Bank' },
        { code: '057', name: 'Zenith Bank' },
      ]);
    }

    const response = await fetch(`${PAYCREST_API_URL}/institutions/${encodeURIComponent(currency)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Paycrest API error (institutions):', response.status, error);
      // Return default institutions on error
      return NextResponse.json([
        { code: '044', name: 'Access Bank' },
        { code: '011', name: 'First Bank of Nigeria' },
        { code: '058', name: 'Guaranty Trust Bank' },
        { code: '068', name: 'United Bank for Africa' },
        { code: '057', name: 'Zenith Bank' },
      ]);
    }

    const data = await response.json();
    
    // Transform Paycrest response to our format
    // Expected format: { institutions: [{ code, name, ... }] }
    const institutions = Array.isArray(data) 
      ? data.map((i: { code?: string; bankCode?: string; name?: string; bankName?: string }) => ({
          code: i.code || i.bankCode || '',
          name: i.name || i.bankName || '',
        }))
      : data.institutions?.map((i: { code?: string; bankCode?: string; name?: string; bankName?: string }) => ({
          code: i.code || i.bankCode || '',
          name: i.name || i.bankName || '',
        })) || [];

    return NextResponse.json(institutions);
  } catch (error) {
    console.error('Error fetching institutions from Paycrest:', error);
    // Return default institutions on exception
    return NextResponse.json([
      { code: '044', name: 'Access Bank' },
      { code: '011', name: 'First Bank of Nigeria' },
      { code: '058', name: 'Guaranty Trust Bank' },
      { code: '068', name: 'United Bank for Africa' },
      { code: '057', name: 'Zenith Bank' },
    ]);
  }
}
