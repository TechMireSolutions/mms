import { useCallback } from "react";
import type { AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { reportClientError } from "@/lib/clientErrorReporting";
import { getApiValidationMessage } from "@/lib/apiValidationMessage";

export function safeAudit(promise: Promise<unknown>, scope: string): void {
  void promise.catch((auditError) => {
    reportClientError(auditError, { scope });
  });
}

export function useContactsCrudNotify() {
  const { t } = useTranslation();

  const handleError = useCallback(
    (err: unknown, scope: string, messageKey: AppTranslationKey = "contacts.saveFailed") => {
      const validationMessage = getApiValidationMessage(err);
      notify.error(t(messageKey), validationMessage ? { description: validationMessage } : undefined);
      reportClientError(err, { scope });
    },
    [t],
  );

  const saveFailed = useCallback(() => {
    notify.error(t("contacts.saveFailed"));
  }, [t]);

  const notifyBulkResult = useCallback(
    (
      succeeded: number,
      failed: number,
      singleSuccessKey: AppTranslationKey,
      multiSuccessKey: AppTranslationKey,
      conflictDetail?: string,
    ) => {
      if (succeeded > 0 && failed === 0) {
        notify.success(
          succeeded === 1 ? t(singleSuccessKey) : t(multiSuccessKey, { count: succeeded }),
        );
      } else if (succeeded > 0 && failed > 0) {
        notify.warning(t("contacts.bulkPartialFailure", { succeeded, failed }), {
          description: conflictDetail,
        });
      } else if (conflictDetail) {
        notify.error(t(messageKeyForBulkFailure(singleSuccessKey)), {
          description: conflictDetail,
        });
      } else {
        saveFailed();
      }
    },
    [t, saveFailed],
  );

  return { t, handleError, notifyBulkResult };
}

function messageKeyForBulkFailure(singleSuccessKey: AppTranslationKey): AppTranslationKey {
  if (singleSuccessKey === "contacts.restoreSuccessTitle") return "contacts.restoreFailed";
  return "contacts.saveFailed";
}
