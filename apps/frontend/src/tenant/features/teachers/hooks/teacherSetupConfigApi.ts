import { apiContract } from "@/lib/api";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";
import type { TeacherModulePreferences } from "@mms/shared";
import { normalizeTeacherModulePreferences } from "@mms/shared";

const api = createModuleSetupConfigApi<TeacherModulePreferences>({
  fetchPreferencesFn: async (_signal) => {
    const res = await apiContract.teachers.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as { preferences: TeacherModulePreferences }).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.teachers.updatePreferences({ body: prefs });
    return (res.body as { preferences: TeacherModulePreferences }).preferences;
  },
  normalizePrefs: normalizeTeacherModulePreferences as (prefs: unknown) => TeacherModulePreferences,
});

export const setTeacherPreferencesMemory = api.setPreferencesMemory;
export const fetchTeacherPreferences = api.fetchPreferences;
export const saveTeacherPreferencesAsync = api.savePreferencesAsync;
export const getTeacherSettingsMemoryFallback = api.getSettingsMemoryFallback;
