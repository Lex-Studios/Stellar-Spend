import { NextRequest, NextResponse } from 'next/server';
import { getPendingScheduledTransactions, executeScheduledTransaction } from '@/lib/services/scheduling.service';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const secret = req.headers.get('x-cron-secret');
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pending = await getPendingScheduledTransactions();
    logger.info(`Processing ${pending.length} scheduled transactions`);

    for (const scheduled of pending) {
      try {
        // Execute transaction logic here
        // For now, just mark as executed
        await executeScheduledTransaction(scheduled.id, '');
        logger.info(`Executed scheduled transaction ${scheduled.id}`);
      } catch (error) {
        logger.error(`Failed to execute scheduled transaction ${scheduled.id}`, error);
      }
    }

    return NextResponse.json({
      processed: pending.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cron job failed', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
