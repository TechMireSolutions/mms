import { useCallback } from "react";
import type { AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { reportClientError } from "@/lib/clientErrorReporting";
import { getApiValidationMessage } from "@/lib/apiValidationMessage";

export interface UseModuleCrudNotifyOptions {
  saveFailedKey: AppTranslationKey;
  bulkPartialFailureKey: AppTranslationKey;
  defaultErrorKey: AppTranslationKey;
  messageKeyForBulkFailure: (singleSuccessKey: AppTranslationKey) => AppTranslationKey;
}

/** Shared CRUD error / bulk-result toast helpers for module Work actions. */
export function useModuleCrudNotify({
  saveFailedKey,
  bulkPartialFailureKey,
  defaultErrorKey,
  messageKeyForBulkFailure,
}: UseModuleCrudNotifyOptions) {
  const { t } = useTranslation();

  const handleError = useCallback(
    (err: unknown, scope: string, messageKey: AppTranslationKey = defaultErrorKey) => {
      const validationMessage = getApiValidationMessage(err);
      notify.error(t(messageKey), validationMessage ? { description: validationMessage } : undefined);
      reportClientError(err, { scope });
    },
    [t, defaultErrorKey],
  );

  const saveFailed = useCallback(() => {
    notify.error(t(saveFailedKey));
  }, [t, saveFailedKey]);

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
        notify.warning(t(bulkPartialFailureKey, { succeeded, failed }), {
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
    [t, saveFailed, bulkPartialFailureKey, messageKeyForBulkFailure],
  );

  return { t, handleError, notifyBulkResult };
}
