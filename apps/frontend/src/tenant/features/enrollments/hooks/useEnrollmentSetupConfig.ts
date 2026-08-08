import {
  DEFAULT_ENROLLMENTS_SETTINGS,
  ENROLLMENTS_MODULE_MANIFEST,
  composeEnrollmentsSettings,
  normalizeEnrollmentModulePreferences,
  type EnrollmentModulePreferences,
  type EnrollmentsSettings,
} from "@mms/shared";
import { createModuleSetupConfigHooks } from "@/lib/query/createModuleSetupConfigHooks";
import {
  fetchEnrollmentFieldConfig,
  fetchEnrollmentPreferences,
  getEnrollmentSettingsMemoryFallback,
  saveEnrollmentFieldConfigAsync,
  saveEnrollmentPreferencesAsync,
  setEnrollmentFieldConfigMemory,
  setEnrollmentPreferencesMemory,
} from "@/tenant/features/enrollments/hooks/enrollmentSetupConfigApi";

export const ENROLLMENTS_FIELD_CONFIG_QUERY_KEY = [
  ENROLLMENTS_MODULE_MANIFEST.collectionKey,
  "field-config",
] as const;

export const ENROLLMENTS_PREFERENCES_QUERY_KEY = [
  ENROLLMENTS_MODULE_MANIFEST.collectionKey,
  "preferences",
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<
  EnrollmentsSettings,
  EnrollmentModulePreferences,
  EnrollmentModulePreferences | EnrollmentsSettings
>({
  fieldConfigQueryKey: ENROLLMENTS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: ENROLLMENTS_PREFERENCES_QUERY_KEY,
  fetchFieldConfig: fetchEnrollmentFieldConfig,
  saveFieldConfig: saveEnrollmentFieldConfigAsync,
  setFieldConfigMemory: setEnrollmentFieldConfigMemory,
  fieldConfigPlaceholder: () => getEnrollmentSettingsMemoryFallback() || DEFAULT_ENROLLMENTS_SETTINGS,
  fetchPreferences: fetchEnrollmentPreferences,
  savePreferences: saveEnrollmentPreferencesAsync,
  setPreferencesMemory: setEnrollmentPreferencesMemory,
  preferencesPlaceholder: () => normalizeEnrollmentModulePreferences(null),
  invalidateFieldConfigOnPreferencesSave: true,
});

export const useEnrollmentFieldConfigQuery = setupConfigHooks.useFieldConfigQuery;
export const useEnrollmentFieldConfigMutation = setupConfigHooks.useFieldConfigMutation;
export const useEnrollmentPreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useEnrollmentPreferencesMutation = setupConfigHooks.usePreferencesMutation;

/** Composed EnrollmentsSettings from typed field-config + preferences queries. */
export function useComposedEnrollmentsSettings(): EnrollmentsSettings {
  const fieldQuery = useEnrollmentFieldConfigQuery();
  const prefsQuery = useEnrollmentPreferencesQuery();
  return composeEnrollmentsSettings(
    fieldQuery.data,
    prefsQuery.data ?? normalizeEnrollmentModulePreferences(null),
    fieldQuery.data?.formTabs,
  );
}
