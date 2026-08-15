import {
  STUDENT_TAB_REGISTRY,
  DEFAULT_STUDENT_ENABLED_TABS,
  DEFAULT_STUDENT_REQUIRED_TABS,
  STUDENT_LOCKED_ENABLED_TABS,
} from "@mms/shared";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { type StudentsSettings } from "@mms/shared";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useStudentsSetupSaveActions } from "@/tenant/features/students/hooks/useStudentsSetupSaveActions";

/** Students Setup panel state — Contacts useContactsSetupPanelState analogue. */
export function useStudentsSetupPanelState({
  mode,
}: {
  mode?: "fields" | "preferences";
}) {
  const config = useStudentConfig();
  const {
    settings,
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
  } = useModuleSettingsEditor<StudentsSettings>({
    config,
    tabRegistry: STUDENT_TAB_REGISTRY,
    defaultEnabledTabs: DEFAULT_STUDENT_ENABLED_TABS,
    defaultRequiredTabs: DEFAULT_STUDENT_REQUIRED_TABS,
    lockedEnabledTabs: STUDENT_LOCKED_ENABLED_TABS,
  });

  const {
    saving,
    isDirty,
    isFieldsDirty,
    isPrefsDirty,
    handleSave,
  } = useStudentsSetupSaveActions({
    settings,
    settingsDraft,
    fieldsEditor,
    mode,
    setSaved,
  });

  return {
    settingsDraft,
    upd,
    saved,
    setSaved,
    saving,
    isDirty,
    isFieldsDirty,
    isPrefsDirty,
    handleSave,
    showFields: mode === "fields",
    showPrefs: mode === "preferences",
  };
}

