import { reportClientError } from "@/lib/clientErrorReporting";

/** Fire-and-forget audit mutation; report failures without blocking the primary UX. */
export function safeAudit(promise: Promise<unknown>, scope: string): void {
  void promise.catch((auditError) => {
    reportClientError(auditError, { scope });
  });
}
