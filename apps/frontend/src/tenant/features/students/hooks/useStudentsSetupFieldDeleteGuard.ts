import { useCallback } from "react";
import type { StudentsSettings } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import {
  preflightStudentFieldDelete,
  type StudentsFieldsDraftSnapshot,
} from "@/tenant/features/students/hooks/studentsSetupDeletePreflight";

/** Guards field deletion against column deps (draft-aware). */
export function useStudentsSetupFieldDeleteGuard({
  settings,
  fieldsDraft,
  onDeleteField,
}: {
  settings: StudentsSettings;
  fieldsDraft: StudentsFieldsDraftSnapshot;
  onDeleteField: (tabId: string, fieldId: string) => void;
}) {
  const { t } = useTranslation();

  return useCallback(
    async (tabId: string, fieldId: string): Promise<boolean> => {
      const allowed = preflightStudentFieldDelete(fieldId, {
        settings,
        fieldsDraft,
        onBlocked: (messageKey, params) => {
          notify.error(t(messageKey as Parameters<typeof t>[0], params));
        },
      });
      if (!allowed) return false;

      onDeleteField(tabId, fieldId);
      return true;
    },
    [settings, fieldsDraft, onDeleteField, t],
  );
}
