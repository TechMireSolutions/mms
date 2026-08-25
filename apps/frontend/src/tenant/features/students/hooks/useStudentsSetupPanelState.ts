import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { type StudentsSettings } from "@mms/shared";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useStudentsSetupSaveActions } from "@/tenant/features/students/hooks/useStudentsSetupSaveActions";

/** Students Setup panel state */
export function useStudentsSetupPanelState() {
  const config = useStudentConfig();
  const {
    settings,
    settingsDraft,
    saved,
    setSaved,
    upd,
  } = useModuleSettingsEditor<StudentsSettings>({
    config,
  });

  const {
    saving,
    isPrefsDirty,
    handleSave,
  } = useStudentsSetupSaveActions({
    settings,
    settingsDraft,
    setSaved,
  });

  return {
    settingsDraft,
    upd,
    saved,
    setSaved,
    saving,
    isPrefsDirty,
    isDirty: isPrefsDirty,
    handleSave,
  };
}
