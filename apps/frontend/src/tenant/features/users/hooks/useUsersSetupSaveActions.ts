import { useCallback, useMemo, useState } from "react";
import {
  USERS_TAB_REGISTRY,
  type FieldDefinition,
  type TabDefinition,
  type UsersSettings,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { usersFieldsSetupSnapshot } from "@/tenant/features/users/hooks/usersSetupPanelSnapshots";

const PREF_KEYS = [
  "allowSelfRegistration",
  "requireEmailVerification",
  "defaultViewLayout",
  "workspaceRoles",
] as const;

type FieldsEditorLike = {
  formTabs: TabDefinition[];
  enabledTabs: Set<string>;
  requiredTabs: Set<string>;
  tabFields: Record<string, FieldDefinition[]>;
  buildFieldsMap: () => Record<string, FieldDefinition[]>;
  markDraftPristine: () => void;
};

/** Users Setup save + dirty detection (§7 await / dirty). */
export function useUsersSetupSaveActions({
  settings,
  settingsDraft,
  fieldsEditor,
  setSaved,
  saveSettingsAsync,
}: {
  settings: UsersSettings;
  settingsDraft: UsersSettings;
  fieldsEditor: FieldsEditorLike;
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
  saveSettingsAsync: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const isFieldsDirty = useMemo(() => {
    const persistedEnabled =
      settings.enabledTabs && settings.enabledTabs.length > 0
        ? settings.enabledTabs
        : USERS_TAB_REGISTRY.filter((tab) => tab.enabled !== false).map((tab) => tab.key);
    return (
      usersFieldsSetupSnapshot({
        fields: fieldsEditor.buildFieldsMap(),
        enabledTabs: fieldsEditor.enabledTabs,
        requiredTabs: fieldsEditor.requiredTabs,
        formTabs: fieldsEditor.formTabs,
      }) !==
      usersFieldsSetupSnapshot({
        fields: settings.fields as Record<string, FieldDefinition[]> | undefined,
        enabledTabs: persistedEnabled,
        requiredTabs: settings.requiredTabs || [],
        formTabs: settings.formTabs || USERS_TAB_REGISTRY,
      })
    );
  }, [fieldsEditor, settings]);

  const isPrefsDirty = useMemo(() => {
    const draft = settingsDraft as unknown as Record<string, unknown>;
    const savedSettings = settings as unknown as Record<string, unknown>;
    return PREF_KEYS.some((key) => JSON.stringify(draft[key]) !== JSON.stringify(savedSettings[key]));
  }, [settings, settingsDraft]);

  const handleSave = useCallback(async (mode: "fields" | "preferences"): Promise<void> => {
    const dirty = mode === "preferences" ? isPrefsDirty : isFieldsDirty;
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await saveSettingsAsync();
      notify.success(t("users.settingsSaved"), { description: t("users.settingsSavedDesc") });
      setSaved(true);
    } catch (error) {
      notify.error(t("errors.module.title"), {
        description: error instanceof Error ? error.message : t("errors.module.description"),
      });
    } finally {
      setSaving(false);
    }
  }, [isFieldsDirty, isPrefsDirty, saving, saveSettingsAsync, setSaved, t]);

  return {
    saving,
    isFieldsDirty,
    isPrefsDirty,
    handleSave,
  };
}
