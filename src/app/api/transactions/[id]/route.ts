import { NextResponse, type NextRequest } from 'next/server';
import { dal, DatabaseError } from '@/lib/db/dal';
import { ErrorHandler } from '@/lib/error-handler';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return ErrorHandler.validation('Invalid JSON body');
    }

    try {
        const existing = await dal.getById(id);
        if (!existing) {
            return ErrorHandler.notFound('transaction');
        }

        await dal.update(id, body);

        const updated = await dal.getById(id);
        return NextResponse.json(updated, { status: 200 });
    } catch (err) {
        if (err instanceof DatabaseError) {
            return ErrorHandler.serverError(err);
        }
        return ErrorHandler.serverError(err);
    }
}
