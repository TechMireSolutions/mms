import { apiContract } from "@/lib/api";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";
import type { AttendanceModulePreferences } from "@mms/shared";
import { normalizeAttendanceModulePreferences } from "@mms/shared";

const api = createModuleSetupConfigApi<AttendanceModulePreferences>({
  fetchPreferencesFn: async (signal) => {
    const res = await apiContract.attendance.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as any).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.attendance.updatePreferences({ body: prefs as any });
    return (res.body as any).preferences;
  },
  normalizePrefs: normalizeAttendanceModulePreferences as (prefs: unknown) => AttendanceModulePreferences,
});

export const setAttendancePreferencesMemory = api.setPreferencesMemory;
export const fetchAttendancePreferences = api.fetchPreferences;
export const saveAttendancePreferencesAsync = api.savePreferencesAsync;
export const getAttendanceSettingsMemoryFallback = api.getSettingsMemoryFallback;
