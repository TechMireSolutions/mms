import {
  TEACHER_MODULE_PREFERENCE_KEYS,
  normalizeTeacherModulePreferences,
  type TeachersSettings,
} from "@mms/shared";
import { useModuleSetupSaveActions } from "@/lib/setup/useModuleSetupSaveActions";
import { useTeacherPreferencesMutation } from "@/tenant/features/teachers/hooks/useTeacherSetupConfig";
import { useTeacherMutations } from "@/tenant/features/teachers/hooks/useTeachers";

export function useTeachersSetupSaveActions({
  settings,
  settingsDraft,
  setSaved,
}: {
  settings: TeachersSettings;
  settingsDraft: TeachersSettings;
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
}) {
  const preferencesMutation = useTeacherPreferencesMutation();
  const { logSetupAudit } = useTeacherMutations();

  const saveActions = useModuleSetupSaveActions<TeachersSettings>({
    settings,
    settingsDraft,
    setSaved,
    prefsKeys: TEACHER_MODULE_PREFERENCE_KEYS,
    normalizePrefs: normalizeTeacherModulePreferences,
    preferencesMutation: preferencesMutation as unknown as {
      mutateAsync: (prefs: unknown) => Promise<unknown>;
    },
    logSetupAudit,
    keys: {
      auditSummary: "teachers.setup.auditSummary",
      preferencesSaved: "teachers.setup.preferencesSaved",
      saveFailed: "teachers.setup.saveFailed",
      auditChannel: "teachers.setup_audit",
    },
  });

  return saveActions;
}
