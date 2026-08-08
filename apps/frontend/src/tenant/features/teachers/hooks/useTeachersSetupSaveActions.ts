import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_TEACHER_COLUMN_REGISTRY,
  TEACHERS_TAB_REGISTRY,
  TEACHER_MODULE_PREFERENCE_KEYS,
  isTeacherLockedEnabledTab,
  normalizeTeacherModulePreferences,
  resolveTeacherEnabledTabIds,
  syncTeacherColumnRegistryWithFields,
  type FieldDefinition,
  type TeachersSettings,
  type TabDefinition,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { safeAudit } from "@/lib/safeAudit";
import { runModuleFieldsSetupSave } from "@/lib/setup/runModuleFieldsSetupSave";
import {
  useTeacherFieldConfigMutation,
  useTeacherPreferencesMutation,
} from "@/tenant/features/teachers/hooks/useTeacherSetupConfig";
import { useTeacherMutations } from "@/tenant/features/teachers/hooks/useTeachers";
import { syncTeachersCustomTabs } from "@/tenant/features/teachers/hooks/syncTeachersCustomTabs";
import { teachersFieldsSetupSnapshot } from "@/tenant/features/teachers/hooks/teachersSetupPanelSnapshots";
import { useTeachersSetupFieldDeleteGuard } from "@/tenant/features/teachers/hooks/useTeachersSetupFieldDeleteGuard";

type FieldsEditorLike = {
  formTabs: TabDefinition[];
  enabledTabs: Set<string>;
  requiredTabs: Set<string>;
  tabFields: Record<string, FieldDefinition[]>;
  buildFieldsMap: () => Record<string, FieldDefinition[]>;
  markDraftPristine: () => void;
  handleDeleteField: (tabId: string, fieldId: string) => void;
};

/** Teachers Setup save + field delete guards (§7 await / dirty). Students Fields-save parity. */
export function useTeachersSetupSaveActions({
  settings,
  settingsDraft,
  fieldsEditor,
  mode,
  setSaved,
}: {
  settings: TeachersSettings;
  settingsDraft: TeachersSettings;
  fieldsEditor: FieldsEditorLike;
  mode?: "fields" | "preferences";
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
}) {
  const { t } = useTranslation();
  const fieldConfigMutation = useTeacherFieldConfigMutation();
  const preferencesMutation = useTeacherPreferencesMutation();
  const { logSetupAudit } = useTeacherMutations();
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
    const persistedEnabled = resolveTeacherEnabledTabIds(settings);
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
    return TEACHER_MODULE_PREFERENCE_KEYS.some(
      (key) => JSON.stringify(draft[key]) !== JSON.stringify(savedSettings[key]),
    );
  }, [settings, settingsDraft]);

  const isDirty = showPrefs ? isPrefsDirty : isFieldsDirty;

  const handleSave = useCallback(async (): Promise<void> => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      if (showPrefs) {
        await preferencesMutation.mutateAsync(
          normalizeTeacherModulePreferences(settingsDraft),
        );
        safeAudit(
          logSetupAudit.mutateAsync({
            area: "preferences",
            summary: t("teachers.setup.auditSummary", { area: "preferences" }),
          }),
          "teachers.setup_audit",
        );
        notify.success(t("teachers.setup.preferencesSaved"));
        setSaved(true);
        return;
      }

      const fieldsMap = fieldsEditor.buildFieldsMap();
      const enabledSet = new Set(
        [...fieldsEditor.enabledTabs].map((tab) => tab.toLowerCase()),
      );
      const updatedFormTabs = fieldsEditor.formTabs.map((tab) => ({
        ...tab,
        enabled: isTeacherLockedEnabledTab(tab.key)
          ? true
          : enabledSet.has(tab.key.toLowerCase()),
      }));
      const syncedRegistry = syncTeacherColumnRegistryWithFields(
        settings.columnRegistry || DEFAULT_TEACHER_COLUMN_REGISTRY,
        fieldsMap,
        fieldsEditor.enabledTabs,
      );

      const { formTabs: _formTabs, ...settingsWithoutFormTabs } = settings;
      await runModuleFieldsSetupSave({
        formTabs: updatedFormTabs,
        syncCustomTabs: syncTeachersCustomTabs,
        persistFieldConfig: async () => {
          await fieldConfigMutation.mutateAsync({
            ...settingsWithoutFormTabs,
            enabledTabs: Array.from(fieldsEditor.enabledTabs),
            requiredTabs: Array.from(fieldsEditor.requiredTabs).map((tab) => tab.toLowerCase()),
            fields: fieldsMap,
            columnRegistry: syncedRegistry,
            customFields: [],
          });
        },
        markDraftPristine: fieldsEditor.markDraftPristine,
        auditPromise: logSetupAudit.mutateAsync({
          area: "fields",
          summary: t("teachers.setup.auditSummary", { area: "fields" }),
        }),
        auditChannel: "teachers.setup_audit",
        t,
        successKey: "teachers.setup.fieldsSaved",
        failureKey: "teachers.setup.saveFailed",
        setSaved,
      });
    } catch {
      if (showPrefs) {
        setSaved(false);
        notify.error(t("teachers.setup.saveFailed"));
      }
    } finally {
      setSaving(false);
    }
  }, [
    isDirty,
    saving,
    showPrefs,
    preferencesMutation,
    settingsDraft,
    fieldsEditor,
    settings,
    fieldConfigMutation,
    logSetupAudit,
    setSaved,
    t,
  ]);

  return {
    saving,
    isDirty,
    isFieldsDirty,
    isPrefsDirty,
    handleSave,
    handleDeleteFieldWithGuard,
  };
}
