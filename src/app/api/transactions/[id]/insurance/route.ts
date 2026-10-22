import { NextResponse, type NextRequest } from 'next/server';
import { ErrorHandler } from '@/lib/error-handler';
import {
  calculateInsurancePremium,
  createInsurance,
  getInsuranceStatus,
  fileClaim,
} from '@/lib/services';
import { withIdempotency } from '@/lib/idempotency';
import { insuranceClaimPatchSchema, parseBody } from '@/lib/validators';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/transactions/[id]/insurance
 * Returns the insurance policy for a transaction (if any).
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    const result = await getInsuranceStatus(id);
    const rows = (result as { rows: unknown[] }).rows ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ insurance: null }, { status: 200 });
    }
    return NextResponse.json({ insurance: rows[0] }, { status: 200 });
  } catch (err) {
    return ErrorHandler.serverError(err);
  }
}

/**
 * POST /api/transactions/[id]/insurance
 * Purchases insurance for a transaction.
 * Body: { amount: number; currency: string }
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  return withIdempotency(
    request,
    async () => {
      const { id } = await params;

      let body: { amount?: unknown; currency?: unknown };
      try {
        body = await request.json();
      } catch {
        return ErrorHandler.validation('Invalid JSON body');
      }

      const amount = Number(body.amount);
      const currency = typeof body.currency === 'string' ? body.currency : 'USDC';

      if (!amount || isNaN(amount) || amount <= 0) {
        return ErrorHandler.validation('amount must be a positive number');
      }

      try {
        const quote = await calculateInsurancePremium(amount, currency);
        const result = await createInsurance(id, quote.premium, quote.coverage, quote.provider);
        const row = (result as { rows: unknown[] }).rows?.[0] ?? null;
        return NextResponse.json({ insurance: row, quote }, { status: 201 });
      } catch (err) {
        return ErrorHandler.serverError(err);
      }
    },
    { required: true },
  );
}

/**
 * PATCH /api/transactions/[id]/insurance
 * Files a claim against an existing insurance policy.
 * Body: { insuranceId: string; reason: string; evidence?: string }
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return withIdempotency(
    request,
    async () => {
      await params;

      let rawBody: unknown;
      try {
        rawBody = await request.json();
      } catch {
        return ErrorHandler.validation('Invalid JSON body');
      }

      const parsed = parseBody(insuranceClaimPatchSchema, rawBody);
      if (!parsed.ok) {
        return ErrorHandler.validation(parsed.errors[0]?.message ?? 'Validation failed');
      }

      const { insuranceId, reason, evidence } = parsed.data;

      try {
        const result = await fileClaim(insuranceId, reason, evidence);
        const row = (result as { rows: unknown[] }).rows?.[0] ?? null;
        return NextResponse.json({ claim: row }, { status: 200 });
      } catch (err) {
        return ErrorHandler.serverError(err);
      }
    },
    { required: true },
  );
}
