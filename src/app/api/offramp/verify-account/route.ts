import { NextResponse } from 'next/server';

const PAYCREST_API_URL = process.env.PAYCREST_API_URL || 'https://api.paycrest.io/v1';

interface VerifyAccountRequest {
  institution: string;
  accountIdentifier: string;
  currency?: string;
}

/**
 * POST /api/offramp/verify-account
 * 
 * Verifies a bank account via Paycrest API.
 * Returns the account holder's name if verification is successful.
 */
export async function POST(request: Request) {
  try {
    const body: VerifyAccountRequest = await request.json();
    const { institution, accountIdentifier, currency = 'NGN' } = body;

    if (!institution || !accountIdentifier) {
      return NextResponse.json(
        { error: 'Institution and account identifier are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.PAYCREST_API_KEY;
    
    if (!apiKey) {
      console.warn('PAYCREST_API_KEY not configured, cannot verify account');
      // Return mock response for development
      return NextResponse.json({
        accountName: '',
        valid: false,
        message: 'Account verification not available',
      });
    }

    const response = await fetch(`${PAYCREST_API_URL}/verify-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        institution,
        accountIdentifier,
        currency,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Paycrest API error (verify-account):', response.status, error);
      
      // Return empty account name for invalid accounts (not an error toast)
      return NextResponse.json({
        accountName: '',
        valid: false,
        message: 'Account verification failed',
      });
    }

    const data = await response.json();
    
    // Extract account name from Paycrest response
    // Expected formats:
    // - { accountName: "JOHN DOE" }
    // - { data: { accountName: "JOHN DOE" } }
    // - { data: "JOHN DOE" }
    const accountName = data.accountName 
      ?? data.data?.accountName 
      ?? data.data?.account_name 
      ?? data.data 
      ?? '';

    return NextResponse.json({
      accountName: String(accountName),
      valid: !!accountName,
    });
  } catch (error) {
    console.error('Error verifying account via Paycrest:', error);
    // Return empty account name for invalid accounts (not an error toast)
    return NextResponse.json({
      accountName: '',
      valid: false,
      message: 'Account verification failed',
    });
  }
}
