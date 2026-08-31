import { apiContract } from "@/lib/api";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";
import type { AccountingModulePreferences } from "@mms/shared";
import { normalizeAccountingModulePreferences } from "@mms/shared";

const api = createModuleSetupConfigApi<AccountingModulePreferences>({
  fetchPreferencesFn: async (signal) => {
    const res = await apiContract.accounting.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as { preferences: AccountingModulePreferences }).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.accounting.updatePreferences({ body: prefs });
    return (res.body as { preferences: AccountingModulePreferences }).preferences;
  },
  normalizePrefs: normalizeAccountingModulePreferences as (prefs: unknown) => AccountingModulePreferences,
});

export const setAccountingPreferencesMemory = api.setPreferencesMemory;
export const fetchAccountingPreferences = api.fetchPreferences;
export const saveAccountingPreferencesAsync = api.savePreferencesAsync;
export const getAccountingSettingsMemoryFallback = api.getSettingsMemoryFallback;
