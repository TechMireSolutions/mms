import { isTeacherSeedFormTab, type TeachersSettings } from "@mms/shared";
import { useModuleSetupTabDeleteGuard } from "@/lib/setup/useModuleSetupDeleteGuards";
import {
  preflightTeacherFieldsDelete,
  type TeachersFieldsDraftSnapshot,
} from "@/tenant/features/teachers/hooks/teachersSetupDeletePreflight";

/**
 * Guards custom-tab deletion: seed tabs are blocked; fields are preflighted
 * against column registry deps before delete.
 */
export function useTeachersSetupTabDeleteGuard({
  settings,
  fieldsDraft,
  onDeleteTab,
}: {
  settings: TeachersSettings;
  fieldsDraft: TeachersFieldsDraftSnapshot & {
    tabFields: Record<string, Array<{ key: string }>>;
  };
  onDeleteTab: (tabId: string) => void;
}) {
  return useModuleSetupTabDeleteGuard({
    isSeedTab: isTeacherSeedFormTab,
    cannotDeleteSystemTabKey: "teachers.setup.cannotDeleteSystemTab",
    preflightFieldsDelete: preflightTeacherFieldsDelete,
    context: { settings, fieldsDraft },
    tabFields: fieldsDraft.tabFields,
    onDeleteTab,
  });
}
