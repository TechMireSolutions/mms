import * as Sentry from '@sentry/react';
import { isApiError } from '@/lib/apiClient';

/**
 * Heavy half of client error reporting: every import of this module pulls in
 * the full Sentry SDK. It is loaded exclusively via dynamic import from
 * `clientErrorReporting.ts` (the sync facade) so error reporting never blocks
 * first paint — see the lazy-chunk note in vite.config.js.
 */

/**
 * Initializes the Sentry SDK for a configured DSN.
 */
export function initSentry(dsn: string): void {
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
 * Forwards an error to Sentry with scrubbing. Safe to call before `initSentry`
 * resolves — the SDK no-ops until initialized.
 */
export function reportErrorToSentry(error: unknown, context?: Record<string, unknown>): void {
  Sentry.withScope((scope) => {
    if (isApiError(error) && error.requestId) {
      scope.setExtra('requestId', error.requestId);
    }

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
}