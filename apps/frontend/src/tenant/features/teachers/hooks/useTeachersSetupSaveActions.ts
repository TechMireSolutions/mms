import { useMemo } from "react";
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
import { useModuleSetupSaveActions } from "@/lib/setup/useModuleSetupSaveActions";
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
  const fieldConfigMutation = useTeacherFieldConfigMutation();
  const preferencesMutation = useTeacherPreferencesMutation();
  const { logSetupAudit } = useTeacherMutations();

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

  return useModuleSetupSaveActions<TeachersSettings>({
    settings,
    settingsDraft,
    fieldsEditor,
    mode,
    setSaved,
    fieldsSnapshot: teachersFieldsSetupSnapshot,
    resolvePersistedEnabledTabs: resolveTeacherEnabledTabIds,
    defaultRequiredTabs: [],
    defaultTabRegistry: TEACHERS_TAB_REGISTRY,
    lockedTabPredicate: isTeacherLockedEnabledTab,
    defaultColumnRegistry: DEFAULT_TEACHER_COLUMN_REGISTRY,
    registrySyncFn: syncTeacherColumnRegistryWithFields,
    syncCustomTabs: syncTeachersCustomTabs,
    prefsKeys: TEACHER_MODULE_PREFERENCE_KEYS,
    normalizePrefs: normalizeTeacherModulePreferences,
    buildFieldConfigPayload: ({
      settingsWithoutFormTabs,
      enabledTabs,
      requiredTabs,
      fieldsMap,
      syncedRegistry,
    }) => ({
      ...settingsWithoutFormTabs,
      enabledTabs,
      requiredTabs,
      fields: fieldsMap,
      columnRegistry: syncedRegistry,
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
      auditSummary: "teachers.setup.auditSummary",
      preferencesSaved: "teachers.setup.preferencesSaved",
      fieldsSaved: "teachers.setup.fieldsSaved",
      saveFailed: "teachers.setup.saveFailed",
      auditChannel: "teachers.setup_audit",
    },
  });
}
