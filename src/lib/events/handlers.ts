import { eventBus } from './bus';
import { logger } from '../logger';

export function setupEventHandlers() {
  // Transaction lifecycle
  eventBus.on('transaction.created', async (event) => {
    logger.info('Transaction created', { transactionId: event.data.id });
  });

  eventBus.on('transaction.completed', async (event) => {
    logger.info('Transaction completed', { transactionId: event.data.id });
  });

  eventBus.on('transaction.failed', async (event) => {
    logger.error('Transaction failed', { transactionId: event.data.id, reason: event.data.reason });
  });

  // Bridge lifecycle
  eventBus.on('bridge.initiated', async (event) => {
    logger.info('Bridge transfer initiated', { txHash: event.data.txHash });
  });

  eventBus.on('bridge.completed', async (event) => {
    logger.info('Bridge transfer completed', { txHash: event.data.txHash });
  });

  // Payout lifecycle
  eventBus.on('payout.initiated', async (event) => {
    logger.info('Payout initiated', { orderId: event.data.orderId });
  });

  eventBus.on('payout.completed', async (event) => {
    logger.info('Payout completed', { orderId: event.data.orderId });
  });

  eventBus.on('payout.failed', async (event) => {
    logger.error('Payout failed', { orderId: event.data.orderId, reason: event.data.reason });
  });

  // Error handling
  eventBus.on('error.occurred', async (event) => {
    logger.error('Application error', { error: event.data.message, context: event.data.context });
  });
}
