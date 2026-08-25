import {
  FINANCE_MODULE_MANIFEST,
  normalizeFinanceModulePreferences,
  type FinanceModulePreferences,
  type FinanceSettings
} from '@mms/shared';
import { createModuleSetupConfigHooks } from '@/lib/query/createModuleSetupConfigHooks';
import {
  fetchFinancePreferences,
  saveFinancePreferencesAsync,
  setFinancePreferencesMemory,
} from '@/tenant/features/finance/hooks/financeSetupConfigApi';

export const FINANCE_PREFERENCES_QUERY_KEY = [
  FINANCE_MODULE_MANIFEST.collectionKey,
  'preferences',
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<FinanceModulePreferences>({
  preferencesQueryKey: FINANCE_PREFERENCES_QUERY_KEY,
  fetchPreferences: fetchFinancePreferences,
  savePreferences: saveFinancePreferencesAsync,
  setPreferencesMemory: setFinancePreferencesMemory,
  preferencesPlaceholder: () => normalizeFinanceModulePreferences(null),
});

export const useFinancePreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useFinancePreferencesMutation = setupConfigHooks.usePreferencesMutation;

/** Composed FinanceSettings from preferences queries. */
export function useComposedFinanceSettings(): FinanceSettings {
  const prefsQuery = useFinancePreferencesQuery();
  return (prefsQuery.data ?? normalizeFinanceModulePreferences(null)) as unknown as FinanceSettings;
}
