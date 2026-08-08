import { useEffect, useRef } from "react";
import { USERS_TAB_REGISTRY } from "@mms/shared";
import { useUsersConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useUsersSetupSaveActions } from "@/tenant/features/users/hooks/useUsersSetupSaveActions";

/** Shared Users Setup editor + dirty/save for Fields/Preferences (survives tab switches). */
export function useUsersSetupPanelState() {
  const config = useUsersConfig();
  const {
    settings,
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettingsAsync,
    discardDrafts,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: USERS_TAB_REGISTRY,
  });

  const {
    saving,
    isFieldsDirty,
    isPrefsDirty,
    handleSave,
  } = useUsersSetupSaveActions({
    settings,
    settingsDraft,
    fieldsEditor,
    setSaved,
    saveSettingsAsync,
  });

  const dirtyRef = useRef({ fields: false, prefs: false });

  useEffect(() => {
    dirtyRef.current.fields = isFieldsDirty;
    dirtyRef.current.prefs = isPrefsDirty;
  }, [isFieldsDirty, isPrefsDirty]);

  const discardSetupDrafts = () => {
    discardDrafts();
    dirtyRef.current = { fields: false, prefs: false };
    setSaved(true);
  };

  return {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saving,
    isFieldsDirty,
    isPrefsDirty,
    dirtyRef,
    handleSave,
    discardSetupDrafts,
  };
}
