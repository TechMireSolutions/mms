/**
 * Setup field-config + preferences via typed REST.
 */
import {
  composeAccountingSettings,
  normalizeAccountingModulePreferences,
  normalizeAccountingSettings,
  stripAccountingFieldConfigForPersist,
  type AccountingModulePreferences,
  type AccountingSettings,
} from "@mms/shared";
import { apiContract } from "@/lib/api";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";

const api = createModuleSetupConfigApi<AccountingSettings, AccountingModulePreferences>({
  fetchFieldConfigFn: async (signal) => {
    const res = await apiContract.accounting.getFieldConfig({ query: undefined, extraHeaders: {} });
    return (res.body as any).config;
  },
  saveFieldConfigFn: async (config) => {
    const res = await apiContract.accounting.updateFieldConfig({ body: config as any });
    return (res.body as any).config;
  },
  fetchPreferencesFn: async (signal) => {
    const res = await apiContract.accounting.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as any).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.accounting.updatePreferences({ body: prefs as any });
    return (res.body as any).preferences;
  },
  normalizeFieldConfig: normalizeAccountingSettings,
  composeSettings: composeAccountingSettings as any,
  normalizePrefs: normalizeAccountingModulePreferences as any,
  stripFieldConfig: stripAccountingFieldConfigForPersist as any,
});

export const setAccountingFieldConfigMemory = api.setFieldConfigMemory;
export const setAccountingPreferencesMemory = api.setPreferencesMemory;
export const fetchAccountingFieldConfig = api.fetchFieldConfig;
export const saveAccountingFieldConfigAsync = api.saveFieldConfigAsync;
export const fetchAccountingPreferences = api.fetchPreferences;
export const saveAccountingPreferencesAsync = api.savePreferencesAsync;
export const getAccountingSettingsMemoryFallback = api.getSettingsMemoryFallback;
