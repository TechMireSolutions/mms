import { apiContract } from "@/lib/api";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";
import type { SessionModulePreferences } from "@mms/shared";
import { normalizeSessionModulePreferences } from "@mms/shared";

const api = createModuleSetupConfigApi<SessionModulePreferences>({
  fetchPreferencesFn: async (_signal) => {
    const res = await apiContract.sessions.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as any).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.sessions.updatePreferences({ body: prefs as any });
    return (res.body as any).preferences;
  },
  normalizePrefs: normalizeSessionModulePreferences as (prefs: unknown) => SessionModulePreferences,
});

export const setSessionPreferencesMemory = api.setPreferencesMemory;
export const fetchSessionPreferences = api.fetchPreferences;
export const saveSessionPreferencesAsync = api.savePreferencesAsync;
export const getSessionSettingsMemoryFallback = api.getSettingsMemoryFallback;
