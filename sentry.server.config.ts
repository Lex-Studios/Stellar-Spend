import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  environment: process.env.NEXT_PUBLIC_ENV ?? 'development',

  // Capture unhandled promise rejections
  captureUnhandledRejections: true,

  beforeSend(event) {
    // Redact secrets from breadcrumbs / request data
    if (event.request?.headers) {
      const h = event.request.headers as Record<string, string>;
      if (h['authorization']) h['authorization'] = '[Filtered]';
      if (h['x-api-key']) h['x-api-key'] = '[Filtered]';
    }
    return event;
  },

  debug: false,
});
