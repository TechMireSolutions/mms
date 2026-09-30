import { apiContract } from "@/lib/api";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";
import {
  normalizeFacultyModulePreferences,
  type FacultyModulePreferences,
} from "@mms/shared";

const api = createModuleSetupConfigApi<FacultyModulePreferences>({
  fetchPreferencesFn: async (_signal) => {
    const res = await apiContract.faculty.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as { preferences: FacultyModulePreferences }).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.faculty.updatePreferences({ body: prefs });
    return (res.body as { preferences: FacultyModulePreferences }).preferences;
  },
  normalizePrefs: (prefs: unknown) =>
    normalizeFacultyModulePreferences(prefs as Partial<FacultyModulePreferences>),
});

export const setFacultyPreferencesMemory = api.setPreferencesMemory;
export const fetchFacultyPreferences = api.fetchPreferences;
export const saveFacultyPreferencesAsync = api.savePreferencesAsync;
export const getFacultySettingsMemoryFallback = api.getSettingsMemoryFallback;

