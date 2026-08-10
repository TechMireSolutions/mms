import type { AppTranslationKey } from "@mms/shared";
import { useModuleCrudNotify } from "@/lib/useModuleCrudNotify";

export function useTeachersCrudNotify() {
  return useModuleCrudNotify({
    saveFailedKey: "teachers.toast.saveFailed",
    bulkPartialFailureKey: "teachers.toast.bulkPartial",
    defaultErrorKey: "teachers.toast.saveFailed",
    messageKeyForBulkFailure,
  });
}

function messageKeyForBulkFailure(singleSuccessKey: AppTranslationKey): AppTranslationKey {
  if (singleSuccessKey === "teachers.restoreSuccess") return "teachers.restoreFailed";
  if (singleSuccessKey === "teachers.toast.statusUpdated") return "teachers.bulkStatusFailed";
  return "teachers.deleteFailed";
}
