/**
 * Setup field-config + preferences via typed REST.
 */
import {
  composeHasanatSettings,
  normalizeHasanatModulePreferences,
  normalizeHasanatSettings,
  stripHasanatFieldConfigForPersist,
  type HasanatModulePreferences,
  type HasanatSettings,
} from "@mms/shared";
import { apiContract } from "@/lib/api";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";

const api = createModuleSetupConfigApi<HasanatSettings, HasanatModulePreferences>({
  fetchFieldConfigFn: async (signal) => {
    const res = await apiContract.hasanat.getFieldConfig({ query: undefined, extraHeaders: {} });
    return (res.body as any).config;
  },
  saveFieldConfigFn: async (config) => {
    const res = await apiContract.hasanat.updateFieldConfig({ body: config as any });
    return (res.body as any).config;
  },
  fetchPreferencesFn: async (signal) => {
    const res = await apiContract.hasanat.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as any).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.hasanat.updatePreferences({ body: prefs as any });
    return (res.body as any).preferences;
  },
  normalizeFieldConfig: normalizeHasanatSettings,
  composeSettings: composeHasanatSettings as any,
  normalizePrefs: normalizeHasanatModulePreferences as any,
  stripFieldConfig: stripHasanatFieldConfigForPersist as any,
});

export const setHasanatFieldConfigMemory = api.setFieldConfigMemory;
export const setHasanatPreferencesMemory = api.setPreferencesMemory;
export const fetchHasanatFieldConfig = api.fetchFieldConfig;
export const saveHasanatFieldConfigAsync = api.saveFieldConfigAsync;
export const fetchHasanatPreferences = api.fetchPreferences;
export const saveHasanatPreferencesAsync = api.savePreferencesAsync;
export const getHasanatSettingsMemoryFallback = api.getSettingsMemoryFallback;
