import { useEffect, useRef } from "react";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { type TeachersSettings } from "@mms/shared";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useTeachersSetupSaveActions } from "@/tenant/features/teachers/hooks/useTeachersSetupSaveActions";

/** Teachers Setup panel state */
export function useTeachersSetupPanelState() {
  const config = useTeacherConfig();
  const {
    settings,
    settingsDraft,
    saved,
    setSaved,
    upd,
    discardDrafts,
  } = useModuleSettingsEditor<TeachersSettings>({
    config,
  });

  const {
    saving,
    isPrefsDirty,
    handleSave,
  } = useTeachersSetupSaveActions({
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
