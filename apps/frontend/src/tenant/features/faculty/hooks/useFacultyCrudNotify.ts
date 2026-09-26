import type { AppTranslationKey } from "@mms/shared";
import { useModuleCrudNotify } from "@/lib/useModuleCrudNotify";

export function useFacultyCrudNotify() {
  return useModuleCrudNotify({
    saveFailedKey: "faculty.toast.saveFailed",
    bulkPartialFailureKey: "faculty.toast.bulkPartial",
    defaultErrorKey: "faculty.toast.saveFailed",
    messageKeyForBulkFailure,
  });
}

function messageKeyForBulkFailure(singleSuccessKey: AppTranslationKey): AppTranslationKey {
  if (singleSuccessKey === "faculty.restoreSuccess" || singleSuccessKey === "teachers.restoreSuccess") {
    return "faculty.restoreFailed";
  }
  if (singleSuccessKey === "faculty.toast.statusUpdated" || singleSuccessKey === "teachers.toast.statusUpdated") {
    return "faculty.bulkStatusFailed";
  }
  return "faculty.deleteFailed";
}

export const useTeachersCrudNotify = useFacultyCrudNotify;
