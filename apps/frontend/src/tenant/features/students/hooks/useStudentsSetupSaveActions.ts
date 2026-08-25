import {
  STUDENT_MODULE_PREFERENCE_KEYS,
  normalizeStudentModulePreferences,
  type StudentsSettings,
} from "@mms/shared";
import { useModuleSetupSaveActions } from "@/lib/setup/useModuleSetupSaveActions";
import { useStudentPreferencesMutation } from "@/tenant/features/students/hooks/useStudentSetupConfig";
import { useStudentMutations } from "@/tenant/features/students/hooks/useStudentMutations";

export function useStudentsSetupSaveActions({
  settings,
  settingsDraft,
  setSaved,
}: {
  settings: StudentsSettings;
  settingsDraft: StudentsSettings;
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
}) {
  const preferencesMutation = useStudentPreferencesMutation();
  const { logSetupAudit } = useStudentMutations();

  const saveActions = useModuleSetupSaveActions<StudentsSettings>({
    settings,
    settingsDraft,
    setSaved,
    prefsKeys: STUDENT_MODULE_PREFERENCE_KEYS,
    normalizePrefs: normalizeStudentModulePreferences,
    preferencesMutation: preferencesMutation as unknown as {
      mutateAsync: (prefs: unknown) => Promise<unknown>;
    },
    logSetupAudit,
    keys: {
      auditSummary: "students.setup.auditSummary",
      preferencesSaved: "students.setup.preferencesSaved",
      saveFailed: "students.setup.saveFailed",
      auditChannel: "students.setup_audit",
    },
  });

  return saveActions;
}
