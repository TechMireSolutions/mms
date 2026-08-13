import {
  DEFAULT_ATTENDANCE_SETTINGS,
  ATTENDANCE_MODULE_MANIFEST,
  composeAttendanceSettings,
  normalizeAttendanceModulePreferences,
  type AttendanceModulePreferences,
  type AttendanceSettings,
} from "@mms/shared";
import { createModuleSetupConfigHooks } from "@/lib/query/createModuleSetupConfigHooks";
import {
  fetchAttendanceFieldConfig,
  fetchAttendancePreferences,
  getAttendanceSettingsMemoryFallback,
  saveAttendanceFieldConfigAsync,
  saveAttendancePreferencesAsync,
  setAttendanceFieldConfigMemory,
  setAttendancePreferencesMemory,
} from "@/tenant/features/attendance/hooks/attendanceSetupConfigApi";

export const ATTENDANCE_FIELD_CONFIG_QUERY_KEY = [
  ATTENDANCE_MODULE_MANIFEST.collectionKey,
  "field-config",
] as const;

export const ATTENDANCE_PREFERENCES_QUERY_KEY = [
  ATTENDANCE_MODULE_MANIFEST.collectionKey,
  "preferences",
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<
  AttendanceSettings,
  AttendanceModulePreferences,
  AttendanceModulePreferences | AttendanceSettings
>({
  fieldConfigQueryKey: ATTENDANCE_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: ATTENDANCE_PREFERENCES_QUERY_KEY,
  fetchFieldConfig: fetchAttendanceFieldConfig,
  saveFieldConfig: saveAttendanceFieldConfigAsync,
  setFieldConfigMemory: setAttendanceFieldConfigMemory,
  fieldConfigPlaceholder: () => getAttendanceSettingsMemoryFallback() || DEFAULT_ATTENDANCE_SETTINGS,
  fetchPreferences: fetchAttendancePreferences,
  savePreferences: saveAttendancePreferencesAsync,
  setPreferencesMemory: setAttendancePreferencesMemory,
  preferencesPlaceholder: () => normalizeAttendanceModulePreferences(null),
  invalidateFieldConfigOnPreferencesSave: true,
});

export const useAttendanceFieldConfigQuery = setupConfigHooks.useFieldConfigQuery;
export const useAttendanceFieldConfigMutation = setupConfigHooks.useFieldConfigMutation;
export const useAttendancePreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useAttendancePreferencesMutation = setupConfigHooks.usePreferencesMutation;

/** Composed AttendanceSettings from typed field-config + preferences queries. */
export function useComposedAttendanceSettings(): AttendanceSettings {
  const fieldQuery = useAttendanceFieldConfigQuery();
  const prefsQuery = useAttendancePreferencesQuery();
  return composeAttendanceSettings(
    fieldQuery.data,
    prefsQuery.data ?? normalizeAttendanceModulePreferences(null),
    fieldQuery.data?.formTabs,
  );
}
