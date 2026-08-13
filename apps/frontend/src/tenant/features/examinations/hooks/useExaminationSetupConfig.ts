import {
  DEFAULT_EXAMINATIONS_SETTINGS,
  EXAMINATIONS_MODULE_MANIFEST,
  composeExaminationsSettings,
  normalizeExaminationsModulePreferences,
  type ExaminationsModulePreferences,
  type ExaminationsSettings,
} from "@mms/shared";
import { createModuleSetupConfigHooks } from "@/lib/query/createModuleSetupConfigHooks";
import {
  fetchExaminationFieldConfig,
  fetchExaminationPreferences,
  getExaminationSettingsMemoryFallback,
  saveExaminationFieldConfigAsync,
  saveExaminationPreferencesAsync,
  setExaminationFieldConfigMemory,
  setExaminationPreferencesMemory,
} from "@/tenant/features/examinations/hooks/examinationSetupConfigApi";

export const EXAMINATIONS_FIELD_CONFIG_QUERY_KEY = [
  EXAMINATIONS_MODULE_MANIFEST.collectionKey,
  "field-config",
] as const;

export const EXAMINATIONS_PREFERENCES_QUERY_KEY = [
  EXAMINATIONS_MODULE_MANIFEST.collectionKey,
  "preferences",
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<
  ExaminationsSettings,
  ExaminationsModulePreferences,
  ExaminationsModulePreferences | ExaminationsSettings
>({
  fieldConfigQueryKey: EXAMINATIONS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: EXAMINATIONS_PREFERENCES_QUERY_KEY,
  fetchFieldConfig: fetchExaminationFieldConfig,
  saveFieldConfig: saveExaminationFieldConfigAsync,
  setFieldConfigMemory: setExaminationFieldConfigMemory,
  fieldConfigPlaceholder: () => getExaminationSettingsMemoryFallback() || DEFAULT_EXAMINATIONS_SETTINGS,
  fetchPreferences: fetchExaminationPreferences,
  savePreferences: saveExaminationPreferencesAsync,
  setPreferencesMemory: setExaminationPreferencesMemory,
  preferencesPlaceholder: () => normalizeExaminationsModulePreferences(null),
  invalidateFieldConfigOnPreferencesSave: true,
});

export const useExaminationFieldConfigQuery = setupConfigHooks.useFieldConfigQuery;
export const useExaminationFieldConfigMutation = setupConfigHooks.useFieldConfigMutation;
export const useExaminationPreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useExaminationPreferencesMutation = setupConfigHooks.usePreferencesMutation;

/** Composed ExaminationsSettings from typed field-config + preferences queries. */
export function useComposedExaminationsSettings(): ExaminationsSettings {
  const fieldQuery = useExaminationFieldConfigQuery();
  const prefsQuery = useExaminationPreferencesQuery();
  return composeExaminationsSettings(
    fieldQuery.data,
    prefsQuery.data ?? normalizeExaminationsModulePreferences(null),
    fieldQuery.data?.formTabs,
  );
}
