import {
  DEFAULT_FINANCE_SETTINGS,
  FINANCE_MODULE_MANIFEST,
  composeFinanceSettings,
  normalizeFinanceModulePreferences,
  type FinanceModulePreferences,
  type FinanceSettings,
} from "@mms/shared";
import { createModuleSetupConfigHooks } from "@/lib/query/createModuleSetupConfigHooks";
import {
  fetchFinanceFieldConfig,
  fetchFinancePreferences,
  getFinanceSettingsMemoryFallback,
  saveFinanceFieldConfigAsync,
  saveFinancePreferencesAsync,
  setFinanceFieldConfigMemory,
  setFinancePreferencesMemory,
} from "@/tenant/features/finance/hooks/financeSetupConfigApi";

export const FINANCE_FIELD_CONFIG_QUERY_KEY = [
  FINANCE_MODULE_MANIFEST.collectionKey,
  "field-config",
] as const;

export const FINANCE_PREFERENCES_QUERY_KEY = [
  FINANCE_MODULE_MANIFEST.collectionKey,
  "preferences",
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<
  FinanceSettings,
  FinanceModulePreferences,
  FinanceModulePreferences | FinanceSettings
>({
  fieldConfigQueryKey: FINANCE_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: FINANCE_PREFERENCES_QUERY_KEY,
  fetchFieldConfig: fetchFinanceFieldConfig,
  saveFieldConfig: saveFinanceFieldConfigAsync,
  setFieldConfigMemory: setFinanceFieldConfigMemory,
  fieldConfigPlaceholder: () => getFinanceSettingsMemoryFallback() || DEFAULT_FINANCE_SETTINGS,
  fetchPreferences: fetchFinancePreferences,
  savePreferences: saveFinancePreferencesAsync,
  setPreferencesMemory: setFinancePreferencesMemory,
  preferencesPlaceholder: () => normalizeFinanceModulePreferences(null),
  invalidateFieldConfigOnPreferencesSave: true,
});

export const useFinanceFieldConfigQuery = setupConfigHooks.useFieldConfigQuery;
export const useFinanceFieldConfigMutation = setupConfigHooks.useFieldConfigMutation;
export const useFinancePreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useFinancePreferencesMutation = setupConfigHooks.usePreferencesMutation;

/** Composed FinanceSettings from typed field-config + preferences queries. */
export function useComposedFinanceSettings(): FinanceSettings {
  const fieldQuery = useFinanceFieldConfigQuery();
  const prefsQuery = useFinancePreferencesQuery();
  return composeFinanceSettings(
    fieldQuery.data,
    prefsQuery.data ?? normalizeFinanceModulePreferences(null),
    fieldQuery.data?.formTabs,
  );
}
