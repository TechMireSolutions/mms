import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  DEFAULT_STUDENT_ENABLED_TABS,
  DEFAULT_STUDENT_REQUIRED_TABS,
  STUDENT_SETTINGS_VERSION,
  STUDENT_TAB_REGISTRY,
  isStudentLockedEnabledTab,
  listEnabledCustomStudentFormFields,
  normalizeStudentModulePreferences,
  syncStudentColumnRegistryWithFields,
  type FieldDefinition,
  type StudentsSettings,
  type TabDefinition,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import {
  useStudentFieldConfigMutation,
  useStudentPreferencesMutation,
} from "@/tenant/features/students/hooks/useStudentSetupConfig";
import { syncStudentsCustomTabs } from "@/tenant/features/students/hooks/syncStudentsCustomTabs";

const PREF_KEYS = [
  "grNumberTemplate",
  "grNumberDigits",
  "grNumberRestartAnnually",
  "autoGenerateId",
] as const;

function studentsFieldsSnapshot(input: {
  fields: unknown;
  enabledTabs: Iterable<string>;
  requiredTabs: Iterable<string>;
  formTabs: Array<{ key: string; enabled?: boolean; label?: string; order?: number }>;
}): string {
  const enabled = [...input.enabledTabs].map((tab) => tab.toLowerCase()).sort();
  const required = [...input.requiredTabs].map((tab) => tab.toLowerCase()).sort();
  const formTabs = input.formTabs
    .map((tab) => ({
      key: tab.key.toLowerCase(),
      enabled: tab.enabled !== false,
      label: tab.label,
      order: tab.order ?? 0,
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
  return JSON.stringify({
    fields: input.fields || {},
    enabled,
    required,
    formTabs,
  });
}

function deriveCompatCustomFields(fields: Record<string, FieldDefinition[]>) {
  return listEnabledCustomStudentFormFields(fields).map((field) => ({
    id: field.key,
    label: field.label,
    type: (field.type === "textarea"
      || field.type === "number"
      || field.type === "select"
      || field.type === "boolean"
      || field.type === "date"
      ? field.type
      : "text") as "text" | "textarea" | "number" | "select" | "boolean" | "date",
    required: field.required,
    options: field.options,
  }));
}

type FieldsEditorLike = {
  formTabs: TabDefinition[];
  enabledTabs: Set<string>;
  requiredTabs: Set<string>;
  buildFieldsMap: () => Record<string, FieldDefinition[]>;
  markDraftPristine: () => void;
};

export function useStudentsSettingsSave({
  settings,
  settingsDraft,
  fieldsEditor,
  showPrefs,
  setSaved,
}: {
  settings: StudentsSettings;
  settingsDraft: StudentsSettings;
  fieldsEditor: FieldsEditorLike;
  showPrefs: boolean;
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
}) {
  const { t } = useTranslation();
  const fieldConfigMutation = useStudentFieldConfigMutation();
  const preferencesMutation = useStudentPreferencesMutation();
  const [saving, setSaving] = useState(false);

  const isFieldsDirty = useMemo(() => {
    const persistedEnabled =
      settings.enabledTabs && settings.enabledTabs.length > 0
        ? settings.enabledTabs
        : DEFAULT_STUDENT_ENABLED_TABS;
    return (
      studentsFieldsSnapshot({
        fields: fieldsEditor.buildFieldsMap(),
        enabledTabs: fieldsEditor.enabledTabs,
        requiredTabs: fieldsEditor.requiredTabs,
        formTabs: fieldsEditor.formTabs,
      }) !==
      studentsFieldsSnapshot({
        fields: settings.fields,
        enabledTabs: persistedEnabled,
        requiredTabs: settings.requiredTabs || DEFAULT_STUDENT_REQUIRED_TABS,
        formTabs: settings.formTabs || STUDENT_TAB_REGISTRY,
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
      if (showPrefs) {
        await preferencesMutation.mutateAsync(
          normalizeStudentModulePreferences(settingsDraft),
        );
        notify.success(t("students.setup.preferencesSaved"));
        setSaved(true);
        return;
      }

      const fieldsMap = fieldsEditor.buildFieldsMap();
      const enabledSet = new Set(
        [...fieldsEditor.enabledTabs].map((tab) => tab.toLowerCase()),
      );
      const updatedFormTabs = fieldsEditor.formTabs.map((tab) => ({
        ...tab,
        enabled: isStudentLockedEnabledTab(tab.key)
          ? true
          : enabledSet.has(tab.key.toLowerCase()),
      }));
      const syncedRegistry = syncStudentColumnRegistryWithFields(
        settings.columnRegistry || DEFAULT_STUDENT_COLUMN_REGISTRY,
        fieldsMap,
        fieldsEditor.enabledTabs,
      );

      await syncStudentsCustomTabs(updatedFormTabs);
      await fieldConfigMutation.mutateAsync({
        ...settings,
        version: STUDENT_SETTINGS_VERSION,
        enabledTabs: Array.from(fieldsEditor.enabledTabs),
        requiredTabs: Array.from(fieldsEditor.requiredTabs).map((tab) => tab.toLowerCase()),
        formTabs: updatedFormTabs,
        fields: fieldsMap,
        columnRegistry: syncedRegistry,
        customFields: deriveCompatCustomFields(fieldsMap),
      });
      fieldsEditor.markDraftPristine();
      notify.success(t("students.setup.fieldsSaved"));
      setSaved(true);
    } catch {
      setSaved(false);
      notify.error(t("students.setup.saveFailed"));
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
    setSaved,
    t,
  ]);

  return { saving, isDirty, isFieldsDirty, isPrefsDirty, handleSave };
}
