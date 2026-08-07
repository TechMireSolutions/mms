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
import { safeAudit } from "@/lib/safeAudit";
import { runModuleFieldsSetupSave } from "@/lib/setup/runModuleFieldsSetupSave";
import {
  useStudentFieldConfigMutation,
  useStudentPreferencesMutation,
} from "@/tenant/features/students/hooks/useStudentSetupConfig";
import { useStudentMutations } from "@/tenant/features/students/hooks/useStudentMutations";
import { syncStudentsCustomTabs } from "@/tenant/features/students/hooks/syncStudentsCustomTabs";
import { studentsFieldsSetupSnapshot } from "@/tenant/features/students/hooks/studentsSetupPanelSnapshots";
import { useStudentsSetupFieldDeleteGuard } from "@/tenant/features/students/hooks/useStudentsSetupFieldDeleteGuard";
import { useStudentsSetupTabDeleteGuard } from "@/tenant/features/students/hooks/useStudentsSetupTabDeleteGuard";

const PREF_KEYS = [
  "grNumberTemplate",
  "grNumberDigits",
  "grNumberRestartAnnually",
  "autoGenerateId",
] as const;

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
  tabFields: Record<string, FieldDefinition[]>;
  buildFieldsMap: () => Record<string, FieldDefinition[]>;
  markDraftPristine: () => void;
  handleDeleteField: (tabId: string, fieldId: string) => void;
  handleDeleteTab: (tabId: string) => void;
};

/** Students Setup save + delete guards (Contacts useContactsSetupSaveActions analogue). */
export function useStudentsSetupSaveActions({
  settings,
  settingsDraft,
  fieldsEditor,
  mode,
  setSaved,
}: {
  settings: StudentsSettings;
  settingsDraft: StudentsSettings;
  fieldsEditor: FieldsEditorLike;
  mode?: "fields" | "preferences";
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
}) {
  const { t } = useTranslation();
  const fieldConfigMutation = useStudentFieldConfigMutation();
  const preferencesMutation = useStudentPreferencesMutation();
  const { logSetupAudit } = useStudentMutations();
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

  const handleDeleteFieldWithGuard = useStudentsSetupFieldDeleteGuard({
    settings,
    fieldsDraft,
    onDeleteField: fieldsEditor.handleDeleteField,
  });

  const handleDeleteTabWithGuard = useStudentsSetupTabDeleteGuard({
    settings,
    fieldsDraft,
    onDeleteTab: fieldsEditor.handleDeleteTab,
  });

  const isFieldsDirty = useMemo(() => {
    const persistedEnabled =
      settings.enabledTabs && settings.enabledTabs.length > 0
        ? settings.enabledTabs
        : DEFAULT_STUDENT_ENABLED_TABS;
    return (
      studentsFieldsSetupSnapshot({
        fields: fieldsEditor.buildFieldsMap(),
        enabledTabs: fieldsEditor.enabledTabs,
        requiredTabs: fieldsEditor.requiredTabs,
        formTabs: fieldsEditor.formTabs,
      }) !==
      studentsFieldsSetupSnapshot({
        fields: settings.fields as Record<string, FieldDefinition[]> | undefined,
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
        safeAudit(
          logSetupAudit.mutateAsync({
            area: "preferences",
            summary: t("students.setup.auditSummary", { area: "preferences" }),
          }),
          "students.setup_audit",
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

      const { formTabs: _formTabs, ...settingsWithoutFormTabs } = settings;
      await runModuleFieldsSetupSave({
        formTabs: updatedFormTabs,
        syncCustomTabs: syncStudentsCustomTabs,
        persistFieldConfig: async () => {
          await fieldConfigMutation.mutateAsync({
            ...settingsWithoutFormTabs,
            version: STUDENT_SETTINGS_VERSION,
            enabledTabs: Array.from(fieldsEditor.enabledTabs),
            requiredTabs: Array.from(fieldsEditor.requiredTabs).map((tab) => tab.toLowerCase()),
            fields: fieldsMap,
            columnRegistry: syncedRegistry,
            customFields: deriveCompatCustomFields(fieldsMap),
          });
        },
        markDraftPristine: fieldsEditor.markDraftPristine,
        auditPromise: logSetupAudit.mutateAsync({
          area: "fields",
          summary: t("students.setup.auditSummary", { area: "fields" }),
        }),
        auditChannel: "students.setup_audit",
        t,
        successKey: "students.setup.fieldsSaved",
        failureKey: "students.setup.saveFailed",
        setSaved,
      });
    } catch {
      if (showPrefs) {
        setSaved(false);
        notify.error(t("students.setup.saveFailed"));
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
    handleDeleteTabWithGuard,
  };
}
