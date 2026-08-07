import { isStudentSeedFormTab, type StudentsSettings } from "@mms/shared";
import { useModuleSetupTabDeleteGuard } from "@/lib/setup/useModuleSetupDeleteGuards";
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
  return useModuleSetupTabDeleteGuard({
    isSeedTab: isStudentSeedFormTab,
    cannotDeleteSystemTabKey: "students.setup.cannotDeleteSystemTab",
    preflightFieldsDelete: preflightStudentFieldsDelete,
    context: { settings, fieldsDraft },
    tabFields: fieldsDraft.tabFields,
    onDeleteTab,
  });
}
