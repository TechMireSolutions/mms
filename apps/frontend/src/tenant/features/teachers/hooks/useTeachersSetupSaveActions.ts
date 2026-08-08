import { useCallback, useMemo, useState } from "react";
import {
  TEACHERS_TAB_REGISTRY,
  type FieldDefinition,
  type TeachersSettings,
  type TabDefinition,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { useTeachersSetupFieldDeleteGuard } from "@/tenant/features/teachers/hooks/useTeachersSetupFieldDeleteGuard";
import { teachersFieldsSetupSnapshot } from "@/tenant/features/teachers/hooks/teachersSetupPanelSnapshots";

const PREF_KEYS = [
  "idPrefix",
  "autoGenerateId",
  "requireContactLink",
  "defaultSpecialization",
] as const;

type FieldsEditorLike = {
  formTabs: TabDefinition[];
  enabledTabs: Set<string>;
  requiredTabs: Set<string>;
  tabFields: Record<string, FieldDefinition[]>;
  buildFieldsMap: () => Record<string, FieldDefinition[]>;
  markDraftPristine: () => void;
  handleDeleteField: (tabId: string, fieldId: string) => void;
};

/** Teachers Setup save + field delete guards (§7 await / dirty). */
export function useTeachersSetupSaveActions({
  settings,
  settingsDraft,
  fieldsEditor,
  mode,
  setSaved,
  saveSettingsAsync,
}: {
  settings: TeachersSettings;
  settingsDraft: TeachersSettings;
  fieldsEditor: FieldsEditorLike;
  mode?: "fields" | "preferences";
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
  saveSettingsAsync: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const showPrefs = mode === "preferences";

  const fieldsDraft = useMemo(
    () => ({
      buildFieldsMap: fieldsEditor.buildFieldsMap,
      enabledTabs: fieldsEditor.enabledTabs,
      tabFields: fieldsEditor.tabFields,
    }),
    [fieldsEditor],
  );

  const handleDeleteFieldWithGuard = useTeachersSetupFieldDeleteGuard({
    settings,
    fieldsDraft,
    onDeleteField: fieldsEditor.handleDeleteField,
  });

  const isFieldsDirty = useMemo(() => {
    const persistedEnabled =
      settings.enabledTabs && settings.enabledTabs.length > 0
        ? settings.enabledTabs
        : TEACHERS_TAB_REGISTRY.filter((tab) => tab.enabled !== false).map((tab) => tab.key);
    return (
      teachersFieldsSetupSnapshot({
        fields: fieldsEditor.buildFieldsMap(),
        enabledTabs: fieldsEditor.enabledTabs,
        requiredTabs: fieldsEditor.requiredTabs,
        formTabs: fieldsEditor.formTabs,
      }) !==
      teachersFieldsSetupSnapshot({
        fields: settings.fields as Record<string, FieldDefinition[]> | undefined,
        enabledTabs: persistedEnabled,
        requiredTabs: settings.requiredTabs || [],
        formTabs: settings.formTabs || TEACHERS_TAB_REGISTRY,
      })
    );
  }, [fieldsEditor, settings]);

  const isPrefsDirty = useMemo(() => {
    const draft = settingsDraft as unknown as Record<string, unknown>;
    const savedSettings = settings as unknown as Record<string, unknown>;
    return PREF_KEYS.some((key) => JSON.stringify(draft[key]) !== JSON.stringify(savedSettings[key]));
  }, [settings, settingsDraft]);

  const isDirty = showPrefs ? isPrefsDirty : isFieldsDirty;

  const handleSave = useCallback(async (): Promise<void> => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await saveSettingsAsync();
      notify.success(
        showPrefs
          ? t("teachers.settings.saved")
          : t("teachers.settings.saved"),
      );
      setSaved(true);
    } catch (error) {
      notify.error(t("teachers.setup.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSaving(false);
    }
  }, [isDirty, saving, saveSettingsAsync, showPrefs, setSaved, t]);

  return {
    saving,
    isDirty,
    isFieldsDirty,
    isPrefsDirty,
    handleSave,
    handleDeleteFieldWithGuard,
  };
}
