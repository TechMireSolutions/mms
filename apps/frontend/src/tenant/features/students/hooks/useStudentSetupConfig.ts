import {
  DEFAULT_STUDENTS_SETTINGS,
  STUDENTS_MODULE_MANIFEST,
  composeStudentsSettings,
  normalizeStudentModulePreferences,
  type StudentModulePreferences,
  type StudentsSettings,
} from "@mms/shared";
import { createModuleSetupConfigHooks } from "@/lib/query/createModuleSetupConfigHooks";
import {
  fetchStudentFieldConfig,
  fetchStudentPreferences,
  getStudentSettingsMemoryFallback,
  saveStudentFieldConfigAsync,
  saveStudentPreferencesAsync,
  setStudentFieldConfigMemory,
  setStudentPreferencesMemory,
} from "@/tenant/features/students/hooks/studentSetupConfigApi";

export const STUDENTS_FIELD_CONFIG_QUERY_KEY = [
  STUDENTS_MODULE_MANIFEST.collectionKey,
  "field-config",
] as const;

export const STUDENTS_PREFERENCES_QUERY_KEY = [
  STUDENTS_MODULE_MANIFEST.collectionKey,
  "preferences",
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<
  StudentsSettings,
  StudentModulePreferences,
  StudentModulePreferences | StudentsSettings
>({
  fieldConfigQueryKey: STUDENTS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: STUDENTS_PREFERENCES_QUERY_KEY,
  fetchFieldConfig: fetchStudentFieldConfig,
  saveFieldConfig: saveStudentFieldConfigAsync,
  setFieldConfigMemory: setStudentFieldConfigMemory,
  fieldConfigPlaceholder: () => getStudentSettingsMemoryFallback() || DEFAULT_STUDENTS_SETTINGS,
  fetchPreferences: fetchStudentPreferences,
  savePreferences: saveStudentPreferencesAsync,
  setPreferencesMemory: setStudentPreferencesMemory,
  preferencesPlaceholder: () => normalizeStudentModulePreferences(null),
  invalidateFieldConfigOnPreferencesSave: true,
});

export const useStudentFieldConfigQuery = setupConfigHooks.useFieldConfigQuery;
export const useStudentFieldConfigMutation = setupConfigHooks.useFieldConfigMutation;
const useStudentPreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useStudentPreferencesMutation = setupConfigHooks.usePreferencesMutation;

/** Composed StudentsSettings from typed field-config + preferences queries. */
export function useComposedStudentsSettings(): StudentsSettings {
  const fieldQuery = useStudentFieldConfigQuery();
  const prefsQuery = useStudentPreferencesQuery();
  return composeStudentsSettings(
    fieldQuery.data,
    prefsQuery.data ?? normalizeStudentModulePreferences(null),
    fieldQuery.data?.formTabs,
  );
}
