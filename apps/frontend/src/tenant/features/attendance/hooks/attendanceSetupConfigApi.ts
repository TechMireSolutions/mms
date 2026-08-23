/**
 * Setup field-config + preferences via typed REST.
 */
import {
  composeAttendanceSettings,
  normalizeAttendanceModulePreferences,
  normalizeAttendanceSettings,
  stripAttendanceFieldConfigForPersist,
  type AttendanceModulePreferences,
  type AttendanceSettings,
} from "@mms/shared";
import { apiContract } from "@/lib/api";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";

const api = createModuleSetupConfigApi<AttendanceSettings, AttendanceModulePreferences>({
  fetchFieldConfigFn: async (signal) => {
    const res = await apiContract.attendance.getFieldConfig({ query: undefined, extraHeaders: {} });
    return (res.body as any).config;
  },
  saveFieldConfigFn: async (config) => {
    const res = await apiContract.attendance.updateFieldConfig({ body: config as any });
    return (res.body as any).config;
  },
  fetchPreferencesFn: async (signal) => {
    const res = await apiContract.attendance.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as any).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.attendance.updatePreferences({ body: prefs as any });
    return (res.body as any).preferences;
  },
  normalizeFieldConfig: normalizeAttendanceSettings,
  composeSettings: composeAttendanceSettings as any,
  normalizePrefs: normalizeAttendanceModulePreferences as any,
  stripFieldConfig: stripAttendanceFieldConfigForPersist as any,
});

export const setAttendanceFieldConfigMemory = api.setFieldConfigMemory;
export const setAttendancePreferencesMemory = api.setPreferencesMemory;
export const fetchAttendanceFieldConfig = api.fetchFieldConfig;
export const saveAttendanceFieldConfigAsync = api.saveFieldConfigAsync;
export const fetchAttendancePreferences = api.fetchPreferences;
export const saveAttendancePreferencesAsync = api.savePreferencesAsync;
export const getAttendanceSettingsMemoryFallback = api.getSettingsMemoryFallback;
