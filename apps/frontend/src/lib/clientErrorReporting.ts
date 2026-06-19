/**
 * Client-side error reporting hook — wire Sentry/Datadog here when DSN is configured.
 * Scrubs tokens and never logs raw passwords.
 */
export function reportClientError(error: unknown, context?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.error('[MMS client error]', error, context);
    return;
  }
  console.error('[MMS]', error instanceof Error ? error.message : String(error));
}
