import type { TeachersSettings } from "@mms/shared";
import { useModuleSetupFieldDeleteGuard } from "@/lib/setup/useModuleSetupDeleteGuards";
import {
  preflightTeacherFieldDelete,
  type TeachersFieldsDraftSnapshot,
} from "@/tenant/features/teachers/hooks/teachersSetupDeletePreflight";

/** Guards field deletion against seed/column deps + live usage (draft-aware). */
export function useTeachersSetupFieldDeleteGuard({
  settings,
  fieldsDraft,
  onDeleteField,
}: {
  settings: TeachersSettings;
  fieldsDraft: TeachersFieldsDraftSnapshot;
  onDeleteField: (tabId: string, fieldId: string) => void;
}) {
  return useModuleSetupFieldDeleteGuard({
    preflightFieldDelete: preflightTeacherFieldDelete,
    context: { settings, fieldsDraft },
    onDeleteField,
  });
}
