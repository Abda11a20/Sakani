// apps/frontend/sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    'https://f2b3a9b5dbb4f15474346608cd9ff8f1@o4511860929593344.ingest.us.sentry.io/4511860940537856',
  tracesSampleRate: 1.0,
  debug: false,
});
