// apps/backend/src/instrument.ts
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn:
    process.env.SENTRY_DSN ||
    'https://250bcb8aee7c1dfd25371f51d5461f53@o4511860929593344.ingest.us.sentry.io/4511860955021312',
  tracesSampleRate: 1.0,
});
