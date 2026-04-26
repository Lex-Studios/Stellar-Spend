import { NextRequest, NextResponse } from 'next/server';
import { calculateInsurancePremium, createInsurance } from '@/lib/services/insurance.service';

export async function POST(req: NextRequest) {
  try {
    const { transactionId, amount, currency, includeInsurance } = await req.json();

    if (!includeInsurance) {
      return NextResponse.json({ insurance: null });
    }

    const quote = await calculateInsurancePremium(amount, currency);
    const insurance = await createInsurance(
      transactionId,
      quote.premium,
      quote.coverage,
      quote.provider
    );

    return NextResponse.json({
      insurance: insurance.rows[0],
      quote,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create insurance' },
      { status: 500 }
    );
  }
}
