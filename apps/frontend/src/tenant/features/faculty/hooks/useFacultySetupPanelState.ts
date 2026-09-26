import { useEffect, useRef } from "react";
import { useFacultyConfig, useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { type FacultySettings, type TeachersSettings } from "@mms/shared";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useFacultySetupSaveActions } from "@/tenant/features/faculty/hooks/useFacultySetupSaveActions";

const useConfigHook = useFacultyConfig || useTeacherConfig;

/** Faculty Setup panel state */
export function useFacultySetupPanelState() {
  const config = useConfigHook();
  const {
    settings,
    settingsDraft,
    saved,
    setSaved,
    upd,
    discardDrafts,
  } = useModuleSettingsEditor<FacultySettings | TeachersSettings>({
    config,
  });

  const {
    saving,
    isPrefsDirty,
    handleSave,
  } = useFacultySetupSaveActions({
    settings,
    settingsDraft,
    setSaved,
  });

  const dirtyRef = useRef({ prefs: false });

  useEffect(() => {
    dirtyRef.current.prefs = isPrefsDirty;
  }, [isPrefsDirty]);

  const discardSetupDrafts = () => {
    discardDrafts();
    dirtyRef.current = { prefs: false };
    setSaved(true);
  };

  return {
    settingsDraft,
    upd,
    saved,
    setSaved,
    saving,
    isPrefsDirty,
    isDirty: isPrefsDirty,
    dirtyRef,
    handleSave,
    discardSetupDrafts,
  };
}

export const useTeachersSetupPanelState = useFacultySetupPanelState;

