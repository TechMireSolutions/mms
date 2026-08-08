import {
  DEFAULT_TEACHERS_SETTINGS,
  TEACHERS_MODULE_MANIFEST,
  composeTeachersSettings,
  normalizeTeacherModulePreferences,
  type TeacherModulePreferences,
  type TeachersSettings,
} from "@mms/shared";
import { createModuleSetupConfigHooks } from "@/lib/query/createModuleSetupConfigHooks";
import {
  fetchTeacherFieldConfig,
  fetchTeacherPreferences,
  getTeacherSettingsMemoryFallback,
  saveTeacherFieldConfigAsync,
  saveTeacherPreferencesAsync,
  setTeacherFieldConfigMemory,
  setTeacherPreferencesMemory,
} from "@/tenant/features/teachers/hooks/teacherSetupConfigApi";

export const TEACHERS_FIELD_CONFIG_QUERY_KEY = [
  TEACHERS_MODULE_MANIFEST.collectionKey,
  "field-config",
] as const;

export const TEACHERS_PREFERENCES_QUERY_KEY = [
  TEACHERS_MODULE_MANIFEST.collectionKey,
  "preferences",
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<
  TeachersSettings,
  TeacherModulePreferences,
  TeacherModulePreferences | TeachersSettings
>({
  fieldConfigQueryKey: TEACHERS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: TEACHERS_PREFERENCES_QUERY_KEY,
  fetchFieldConfig: fetchTeacherFieldConfig,
  saveFieldConfig: saveTeacherFieldConfigAsync,
  setFieldConfigMemory: setTeacherFieldConfigMemory,
  fieldConfigPlaceholder: () => getTeacherSettingsMemoryFallback() || DEFAULT_TEACHERS_SETTINGS,
  fetchPreferences: fetchTeacherPreferences,
  savePreferences: saveTeacherPreferencesAsync,
  setPreferencesMemory: setTeacherPreferencesMemory,
  preferencesPlaceholder: () => normalizeTeacherModulePreferences(null),
  invalidateFieldConfigOnPreferencesSave: true,
});

export const useTeacherFieldConfigQuery = setupConfigHooks.useFieldConfigQuery;
export const useTeacherFieldConfigMutation = setupConfigHooks.useFieldConfigMutation;
export const useTeacherPreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useTeacherPreferencesMutation = setupConfigHooks.usePreferencesMutation;

/** Composed TeachersSettings from typed field-config + preferences queries. */
export function useComposedTeachersSettings(): TeachersSettings {
  const fieldQuery = useTeacherFieldConfigQuery();
  const prefsQuery = useTeacherPreferencesQuery();
  return composeTeachersSettings(
    fieldQuery.data,
    prefsQuery.data ?? normalizeTeacherModulePreferences(null),
    fieldQuery.data?.formTabs,
  );
}
