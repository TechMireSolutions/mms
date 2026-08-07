import type { StudentsSettings } from "@mms/shared";
import { useModuleSetupFieldDeleteGuard } from "@/lib/setup/useModuleSetupDeleteGuards";
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
  return useModuleSetupFieldDeleteGuard({
    preflightFieldDelete: preflightStudentFieldDelete,
    context: { settings, fieldsDraft },
    onDeleteField,
  });
}
