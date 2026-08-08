import { useCallback, useMemo, useState } from "react";
import {
  SESSIONS_TAB_REGISTRY,
  type FieldDefinition,
  type SessionsSettings,
  type TabDefinition,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { sessionsFieldsSetupSnapshot } from "@/tenant/features/sessions/hooks/sessionsSetupPanelSnapshots";

const PREF_KEYS = [
  "defaultDuration",
  "defaultSessionType",
  "allowOverlap",
  "archiveOldSessions",
  "requireBudget",
  "timetableConflictCheck",
  "notifyOnSessionStart",
  "academicYear",
  "sessionStart",
  "defaultViewLayout",
] as const;

type FieldsEditorLike = {
  formTabs: TabDefinition[];
  enabledTabs: Set<string>;
  requiredTabs: Set<string>;
  tabFields: Record<string, FieldDefinition[]>;
  buildFieldsMap: () => Record<string, FieldDefinition[]>;
  markDraftPristine: () => void;
};

/** Sessions Setup save + dirty detection (§7 await / dirty). */
export function useSessionsSetupSaveActions({
  settings,
  settingsDraft,
  fieldsEditor,
  mode,
  setSaved,
  saveSettingsAsync,
}: {
  settings: SessionsSettings;
  settingsDraft: SessionsSettings;
  fieldsEditor: FieldsEditorLike;
  mode?: "fields" | "preferences";
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
  saveSettingsAsync: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const showPrefs = mode === "preferences";

  const isFieldsDirty = useMemo(() => {
    const persistedEnabled =
      settings.enabledTabs && settings.enabledTabs.length > 0
        ? settings.enabledTabs
        : SESSIONS_TAB_REGISTRY.filter((tab) => tab.enabled !== false).map((tab) => tab.key);
    return (
      sessionsFieldsSetupSnapshot({
        fields: fieldsEditor.buildFieldsMap(),
        enabledTabs: fieldsEditor.enabledTabs,
        requiredTabs: fieldsEditor.requiredTabs,
        formTabs: fieldsEditor.formTabs,
      }) !==
      sessionsFieldsSetupSnapshot({
        fields: settings.fields as Record<string, FieldDefinition[]> | undefined,
        enabledTabs: persistedEnabled,
        requiredTabs: settings.requiredTabs || [],
        formTabs: settings.formTabs || SESSIONS_TAB_REGISTRY,
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
      notify.success(t("sessions.settings.saved"));
      setSaved(true);
    } catch (error) {
      notify.error(t("settings.serverSaveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSaving(false);
    }
  }, [isDirty, saving, saveSettingsAsync, setSaved, t]);

  return {
    saving,
    isDirty,
    isFieldsDirty,
    isPrefsDirty,
    handleSave,
  };
}
