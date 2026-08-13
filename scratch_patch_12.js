const fs = require('fs');

const f1 = '/Users/syedaalin/Documents/mms/apps/frontend/src/tenant/features/hasanat/hooks/hasanatSetupConfigApi.ts';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/@\/tenant\/apiClient/, '@/lib/apiClient');
fs.writeFileSync(f1, c1);

const f2 = '/Users/syedaalin/Documents/mms/apps/frontend/src/tenant/features/hasanat/hooks/useHasanatSetupConfig.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = `import {
  DEFAULT_HASANAT_SETTINGS,
  HASANAT_MODULE_MANIFEST,
  composeHasanatSettings,
  normalizeHasanatModulePreferences,
  type HasanatModulePreferences,
  type HasanatSettings,
} from "@mms/shared";
import { createModuleSetupConfigHooks } from "@/lib/query/createModuleSetupConfigHooks";
import {
  fetchHasanatFieldConfig,
  fetchHasanatPreferences,
  getHasanatSettingsMemoryFallback,
  saveHasanatFieldConfigAsync,
  saveHasanatPreferencesAsync,
  setHasanatFieldConfigMemory,
  setHasanatPreferencesMemory,
} from "@/tenant/features/hasanat/hooks/hasanatSetupConfigApi";

export const HASANAT_FIELD_CONFIG_QUERY_KEY = [
  HASANAT_MODULE_MANIFEST.collectionKey,
  "field-config",
] as const;

export const HASANAT_PREFERENCES_QUERY_KEY = [
  HASANAT_MODULE_MANIFEST.collectionKey,
  "preferences",
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<
  HasanatSettings,
  HasanatModulePreferences,
  HasanatModulePreferences | HasanatSettings
>({
  fieldConfigQueryKey: HASANAT_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: HASANAT_PREFERENCES_QUERY_KEY,
  fetchFieldConfig: fetchHasanatFieldConfig,
  saveFieldConfig: saveHasanatFieldConfigAsync,
  setFieldConfigMemory: setHasanatFieldConfigMemory,
  fieldConfigPlaceholder: () => getHasanatSettingsMemoryFallback() || DEFAULT_HASANAT_SETTINGS,
  fetchPreferences: fetchHasanatPreferences,
  savePreferences: saveHasanatPreferencesAsync,
  setPreferencesMemory: setHasanatPreferencesMemory,
  preferencesPlaceholder: () => normalizeHasanatModulePreferences(null),
  invalidateFieldConfigOnPreferencesSave: true,
});

export const useHasanatFieldConfigQuery = setupConfigHooks.useFieldConfigQuery;
export const useHasanatFieldConfigMutation = setupConfigHooks.useFieldConfigMutation;
export const useHasanatPreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useHasanatPreferencesMutation = setupConfigHooks.usePreferencesMutation;

/** Composed HasanatSettings from typed field-config + preferences queries. */
export function useComposedHasanatSettings(): HasanatSettings {
  const fieldQuery = useHasanatFieldConfigQuery();
  const prefsQuery = useHasanatPreferencesQuery();
  return composeHasanatSettings(
    fieldQuery.data,
    prefsQuery.data ?? normalizeHasanatModulePreferences(null),
    fieldQuery.data?.formTabs,
  );
}
`;
fs.writeFileSync(f2, c2);

const f3 = '/Users/syedaalin/Documents/mms/apps/frontend/src/hooks/useStandardModuleConfig.ts';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(/import \{ HasanatSettings \} from '\.\.\/tenant\/features\/hasanat\/hooks\/hasanatSetupConfigApi';\n/, "");
fs.writeFileSync(f3, c3);

