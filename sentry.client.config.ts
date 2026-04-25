import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay for error investigation (1% normal, 100% on error)
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // Release tracking
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  environment: process.env.NEXT_PUBLIC_ENV ?? 'development',

  // Filter noise
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    /^Network Error$/,
    /^Request aborted$/,
  ],

  beforeSend(event) {
    // Strip sensitive fields from request bodies
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      for (const key of ['privateKey', 'secret', 'password', 'token']) {
        if (key in data) data[key] = '[Filtered]';
      }
    }
    return event;
  },

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  debug: false,
});
