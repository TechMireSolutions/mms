import {
  DEFAULT_ACCOUNTING_SETTINGS,
  ACCOUNTING_MODULE_MANIFEST,
  composeAccountingSettings,
  normalizeAccountingModulePreferences,
  type AccountingModulePreferences,
  type AccountingSettings,
} from '@mms/shared';
import { createModuleSetupConfigHooks } from '@/lib/query/createModuleSetupConfigHooks';
import {
  fetchAccountingFieldConfig,
  fetchAccountingPreferences,
  getAccountingSettingsMemoryFallback,
  saveAccountingFieldConfigAsync,
  saveAccountingPreferencesAsync,
  setAccountingFieldConfigMemory,
  setAccountingPreferencesMemory,
} from '@/tenant/features/accounting/hooks/accountingSetupConfigApi';

export const ACCOUNTING_FIELD_CONFIG_QUERY_KEY = [
  ACCOUNTING_MODULE_MANIFEST.collectionKey,
  'field-config',
] as const;

export const ACCOUNTING_PREFERENCES_QUERY_KEY = [
  ACCOUNTING_MODULE_MANIFEST.collectionKey,
  'preferences',
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<
  AccountingSettings,
  AccountingModulePreferences,
  AccountingModulePreferences | AccountingSettings
>({
  fieldConfigQueryKey: ACCOUNTING_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: ACCOUNTING_PREFERENCES_QUERY_KEY,
  fetchFieldConfig: fetchAccountingFieldConfig,
  saveFieldConfig: saveAccountingFieldConfigAsync,
  setFieldConfigMemory: setAccountingFieldConfigMemory,
  fieldConfigPlaceholder: () => getAccountingSettingsMemoryFallback() || DEFAULT_ACCOUNTING_SETTINGS,
  fetchPreferences: fetchAccountingPreferences,
  savePreferences: saveAccountingPreferencesAsync,
  setPreferencesMemory: setAccountingPreferencesMemory,
  preferencesPlaceholder: () => normalizeAccountingModulePreferences(null),
  invalidateFieldConfigOnPreferencesSave: true,
});

export const useAccountingFieldConfigQuery = setupConfigHooks.useFieldConfigQuery;
export const useAccountingFieldConfigMutation = setupConfigHooks.useFieldConfigMutation;
export const useAccountingPreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useAccountingPreferencesMutation = setupConfigHooks.usePreferencesMutation;

/** Composed AccountingSettings from typed field-config + preferences queries. */
export function useComposedAccountingSettings(): AccountingSettings {
  const fieldQuery = useAccountingFieldConfigQuery();
  const prefsQuery = useAccountingPreferencesQuery();
  return composeAccountingSettings(
    fieldQuery.data,
    prefsQuery.data ?? normalizeAccountingModulePreferences(null),
    fieldQuery.data?.formTabs,
  );
}
