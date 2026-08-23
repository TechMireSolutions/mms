/**
 * Setup field-config + preferences via typed REST.
 */
import {
  composeSessionsSettings,
  normalizeSessionModulePreferences,
  normalizeSessionsSettings,
  stripSessionFieldConfigForPersist,
  type SessionModulePreferences,
  type SessionsSettings,
} from "@mms/shared";
import { apiContract } from "@/lib/api";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";

const api = createModuleSetupConfigApi<SessionsSettings, SessionModulePreferences>({
  fetchFieldConfigFn: async (signal) => {
    const res = await apiContract.sessions.getFieldConfig({ query: undefined, extraHeaders: {} });
    return (res.body as any).config;
  },
  saveFieldConfigFn: async (config) => {
    const res = await apiContract.sessions.updateFieldConfig({ body: config as any });
    return (res.body as any).config;
  },
  fetchPreferencesFn: async (signal) => {
    const res = await apiContract.sessions.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as any).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.sessions.updatePreferences({ body: prefs as any });
    return (res.body as any).preferences;
  },
  normalizeFieldConfig: normalizeSessionsSettings,
  composeSettings: composeSessionsSettings as any,
  normalizePrefs: normalizeSessionModulePreferences as any,
  stripFieldConfig: stripSessionFieldConfigForPersist as any,
});

export const setSessionFieldConfigMemory = api.setFieldConfigMemory;
export const setSessionPreferencesMemory = api.setPreferencesMemory;
export const fetchSessionFieldConfig = api.fetchFieldConfig;
export const saveSessionFieldConfigAsync = api.saveFieldConfigAsync;
export const fetchSessionPreferences = api.fetchPreferences;
export const saveSessionPreferencesAsync = api.savePreferencesAsync;
export const getSessionSettingsMemoryFallback = api.getSettingsMemoryFallback;
