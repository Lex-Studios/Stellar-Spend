import express from 'express';
import { tracingMiddleware } from './lib/middleware/tracing';
import { initializeTracing } from './lib/monitoring';
import { logger } from './lib/logger';

// Initialize OpenTelemetry tracing
const tracingSDK = initializeTracing();

const app = express();

// Add tracing middleware BEFORE routes
app.use(tracingMiddleware);

// ... rest of your app configuration ...

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('app.shutdown.sigterm', { signal: 'SIGTERM' });
  if (tracingSDK) {
    await tracingSDK.shutdown();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('app.shutdown.sigint', { signal: 'SIGINT' });
  if (tracingSDK) {
    await tracingSDK.shutdown();
  }
  process.exit(0);
});

export default app;
