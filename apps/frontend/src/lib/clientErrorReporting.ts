import * as Sentry from '@sentry/react';

/**
 * Initializes client-side error reporting using Sentry if the DSN is configured.
 */
export function initErrorReporting(): void {
  const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined) || (window as any)._MMS_SENTRY_DSN;
  if (!dsn) {
    console.log('[MMS] Sentry DSN not found. Client error reporting running in console-only mode.');
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Security: Scrub sensitive headers
      if (event.request && event.request.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['Cookie'];
      }
      return event;
    },
  });
  console.log('[MMS] Sentry client error reporting initialized successfully.');
}

/**
 * Client-side error reporting helper.
 * Scrubs tokens and never logs raw passwords.
 */
export function reportClientError(error: unknown, context?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.error('[MMS client error]', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      const sanitizedContext = { ...context };
      // Security/observability compliance: scrub credentials
      if ('password' in sanitizedContext) sanitizedContext.password = '[SCRUBBED]';
      if ('token' in sanitizedContext) sanitizedContext.token = '[SCRUBBED]';
      if ('jwt' in sanitizedContext) sanitizedContext.jwt = '[SCRUBBED]';
      if ('secret' in sanitizedContext) sanitizedContext.secret = '[SCRUBBED]';
      if ('otp' in sanitizedContext) sanitizedContext.otp = '[SCRUBBED]';

      scope.setExtras(sanitizedContext);
    }

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error));
    }
  });

  console.error('[MMS]', error instanceof Error ? error.message : String(error));
}
