import { useCallback } from "react";
import { isStudentSeedFormTab, type StudentsSettings } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import {
  preflightStudentFieldsDelete,
  type StudentsFieldsDraftSnapshot,
} from "@/tenant/features/students/hooks/studentsSetupDeletePreflight";

/**
 * Guards custom-tab deletion: seed tabs are blocked; fields are preflighted
 * against column registry deps before delete.
 */
export function useStudentsSetupTabDeleteGuard({
  settings,
  fieldsDraft,
  onDeleteTab,
}: {
  settings: StudentsSettings;
  fieldsDraft: StudentsFieldsDraftSnapshot & {
    tabFields: Record<string, Array<{ key: string }>>;
  };
  onDeleteTab: (tabId: string) => void;
}) {
  const { t } = useTranslation();

  return useCallback(
    async (tabId: string): Promise<boolean> => {
      if (isStudentSeedFormTab(tabId)) {
        notify.error(t("students.setup.cannotDeleteSystemTab"));
        return false;
      }

      const fieldIds = (fieldsDraft.tabFields[tabId] || []).map((field) => field.key);
      const allowed = preflightStudentFieldsDelete(fieldIds, {
        settings,
        fieldsDraft,
        onBlocked: (messageKey, params) => {
          notify.error(t(messageKey as Parameters<typeof t>[0], params));
        },
      });
      if (!allowed) return false;

      onDeleteTab(tabId);
      return true;
    },
    [settings, fieldsDraft, onDeleteTab, t],
  );
}
