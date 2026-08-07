import type { AppTranslationKey } from "@mms/shared";
import { useModuleCrudNotify } from "@/lib/useModuleCrudNotify";

export function useContactsCrudNotify() {
  return useModuleCrudNotify({
    saveFailedKey: "contacts.saveFailed",
    bulkPartialFailureKey: "contacts.bulkPartialFailure",
    defaultErrorKey: "contacts.saveFailed",
    messageKeyForBulkFailure,
  });
}

function messageKeyForBulkFailure(singleSuccessKey: AppTranslationKey): AppTranslationKey {
  if (singleSuccessKey === "contacts.restoreSuccessTitle") return "contacts.restoreFailed";
  return "contacts.saveFailed";
}
