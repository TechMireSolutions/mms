import { useMemo } from "react";
import {
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  DEFAULT_STUDENT_REQUIRED_TABS,
  STUDENT_MODULE_PREFERENCE_KEYS,
  STUDENT_SETTINGS_VERSION,
  STUDENT_TAB_REGISTRY,
  isStudentLockedEnabledTab,
  listEnabledCustomStudentFormFields,
  normalizeStudentModulePreferences,
  resolveStudentEnabledTabIds,
  syncStudentColumnRegistryWithFields,
  type FieldDefinition,
  type StudentsSettings,
  type TabDefinition,
} from "@mms/shared";
import { useModuleSetupSaveActions } from "@/lib/setup/useModuleSetupSaveActions";
import {
  useStudentFieldConfigMutation,
  useStudentPreferencesMutation,
} from "@/tenant/features/students/hooks/useStudentSetupConfig";
import { useStudentMutations } from "@/tenant/features/students/hooks/useStudentMutations";
import { syncStudentsCustomTabs } from "@/tenant/features/students/hooks/syncStudentsCustomTabs";
import { studentsFieldsSetupSnapshot } from "@/tenant/features/students/hooks/studentsSetupPanelSnapshots";
import { useStudentsSetupFieldDeleteGuard } from "@/tenant/features/students/hooks/useStudentsSetupFieldDeleteGuard";
import { useStudentsSetupTabDeleteGuard } from "@/tenant/features/students/hooks/useStudentsSetupTabDeleteGuard";

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

/** Students Setup save + delete guards (Teachers useTeachersSetupSaveActions analogue). */
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
  const fieldConfigMutation = useStudentFieldConfigMutation();
  const preferencesMutation = useStudentPreferencesMutation();
  const { logSetupAudit } = useStudentMutations();

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

  const saveActions = useModuleSetupSaveActions<StudentsSettings>({
    settings,
    settingsDraft,
    fieldsEditor,
    mode,
    setSaved,
    fieldsSnapshot: studentsFieldsSetupSnapshot,
    resolvePersistedEnabledTabs: resolveStudentEnabledTabIds,
    defaultRequiredTabs: DEFAULT_STUDENT_REQUIRED_TABS,
    defaultTabRegistry: STUDENT_TAB_REGISTRY,
    lockedTabPredicate: isStudentLockedEnabledTab,
    defaultColumnRegistry: DEFAULT_STUDENT_COLUMN_REGISTRY,
    registrySyncFn: syncStudentColumnRegistryWithFields,
    syncCustomTabs: syncStudentsCustomTabs,
    prefsKeys: STUDENT_MODULE_PREFERENCE_KEYS,
    normalizePrefs: normalizeStudentModulePreferences,
    buildFieldConfigPayload: ({
      settingsWithoutFormTabs,
      enabledTabs,
      requiredTabs,
      fieldsMap,
      syncedRegistry,
    }) => ({
      ...settingsWithoutFormTabs,
      version: STUDENT_SETTINGS_VERSION,
      enabledTabs,
      requiredTabs,
      fields: fieldsMap,
      columnRegistry: syncedRegistry,
      customFields: deriveCompatCustomFields(fieldsMap),
    }),
    fieldConfigMutation: fieldConfigMutation as unknown as {
      mutateAsync: (payload: unknown) => Promise<unknown>;
    },
    preferencesMutation: preferencesMutation as unknown as {
      mutateAsync: (prefs: unknown) => Promise<unknown>;
    },
    logSetupAudit,
    handleDeleteFieldWithGuard,
    keys: {
      auditSummary: "students.setup.auditSummary",
      preferencesSaved: "students.setup.preferencesSaved",
      fieldsSaved: "students.setup.fieldsSaved",
      saveFailed: "students.setup.saveFailed",
      auditChannel: "students.setup_audit",
    },
  });

  return {
    ...saveActions,
    handleDeleteTabWithGuard,
  };
}
