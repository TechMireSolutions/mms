const fs = require('fs');
const file = '/Users/syedaalin/Documents/mms/apps/frontend/src/hooks/useStandardModuleConfig.ts';
let code = fs.readFileSync(file, 'utf8');

const importReplacement = `import {
  FINANCE_FIELD_CONFIG_QUERY_KEY,
  FINANCE_PREFERENCES_QUERY_KEY,
  useComposedFinanceSettings,
  useFinanceFieldConfigMutation,
  useFinancePreferencesMutation,
} from '@/tenant/features/finance/hooks/useFinanceSetupConfig';
import {
  setFinanceFieldConfigMemory,
  setFinancePreferencesMemory,
} from '@/tenant/features/finance/hooks/financeSetupConfigApi';
import {
  HASANAT_FIELD_CONFIG_QUERY_KEY,
  HASANAT_PREFERENCES_QUERY_KEY,
  useComposedHasanatSettings,
  useUpdateHasanatFieldConfigMutation,
  useUpdateHasanatPreferencesMutation,
} from '@/tenant/features/hasanat/hooks/useHasanatSetupConfig';
import {
  setHasanatFieldConfigMemory,
  setHasanatPreferencesMemory,
} from '@/tenant/features/hasanat/hooks/hasanatSetupConfigApi';
import type { HasanatSettings } from '@mms/shared';
`;

code = code.replace(/import \{\n  FINANCE_FIELD_CONFIG_QUERY_KEY[\s\S]*?from '@\/tenant\/features\/finance\/hooks\/financeSetupConfigApi';/, importReplacement);

// also add HasanatSettings to imports at top
if (!code.includes('type HasanatSettings')) {
  code = code.replace(/type EnrollmentsSettings,/g, "type EnrollmentsSettings,\n  type HasanatSettings,\n  composeHasanatSettings,\n  normalizeHasanatModulePreferences,\n  normalizeHasanatSettings,");
}

const useHasanatConfigReplacement = `export function useHasanatConfig() {
  const registry = STANDARD_MODULES_CONFIG_REGISTRY.hasanat;
  const queryClient = useQueryClient();
  const settings = useComposedHasanatSettings();
  const fieldMutation = useUpdateHasanatFieldConfigMutation();
  const prefsMutation = useUpdateHasanatPreferencesMutation();

  const defaultSettings = registry.defaultSettings as HasanatSettings;
  const defaultFieldDefs = registry.defaultFieldDefs as unknown as ModuleFieldDef[];

  const mergeSettings = useCallback(
    (settingsDraft: Partial<HasanatSettings> | null | undefined): HasanatSettings => {
      return normalizeHasanatSettings({
        ...defaultSettings,
        ...(settingsDraft ?? {}),
        formTabs: settingsDraft?.formTabs ?? defaultSettings.formTabs ?? [],
        enabledTabs: settingsDraft?.enabledTabs ?? defaultSettings.enabledTabs ?? [],
        requiredTabs: settingsDraft?.requiredTabs ?? defaultSettings.requiredTabs ?? [],
        fields: mergeTabbedFields(defaultSettings.fields || {}, settingsDraft?.fields),
        customFields: settingsDraft?.customFields ?? defaultSettings.customFields ?? [],
        fieldOrder: settingsDraft?.fieldOrder ?? defaultSettings.fieldOrder ?? [],
      });
    },
    [defaultSettings],
  );

  const updateSettings = useCallback(
    (settingsDraft: HasanatSettings) => {
      const merged = normalizeHasanatSettings(settingsDraft);
      const prefs = normalizeHasanatModulePreferences(settingsDraft);
      const composed = composeHasanatSettings(merged, prefs, merged.formTabs);

      queryClient.setQueryData(HASANAT_FIELD_CONFIG_QUERY_KEY, merged);
      queryClient.setQueryData(HASANAT_PREFERENCES_QUERY_KEY, prefs);
      setHasanatFieldConfigMemory(merged);
      setHasanatPreferencesMemory(prefs);

      fieldMutation.mutate(merged);
      prefsMutation.mutate(prefs);
    },
    [queryClient, fieldMutation, prefsMutation],
  );

  const updateSettingsAsync = useCallback(
    async (settingsDraft: HasanatSettings) => {
      await fieldMutation.mutateAsync(normalizeHasanatSettings(settingsDraft));
      await prefsMutation.mutateAsync(normalizeHasanatModulePreferences(settingsDraft));
    },
    [fieldMutation, prefsMutation],
  );

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = useMemo(
    () => (settings.customFields || []) as ModuleCustomField[],
    [settings.customFields],
  );
  const fieldOrder = useMemo(
    () => settings.fieldOrder ?? defaultSettings.fieldOrder ?? [],
    [settings.fieldOrder, defaultSettings.fieldOrder],
  );

  const orderedFields = useMemo(
    () => getSortedFields(defaultFieldDefs, fieldOrder, fields, customFields),
    [defaultFieldDefs, fieldOrder, fields, customFields],
  );

  const isFieldEnabled = useCallback(
    (fieldId: string): boolean => fields[fieldId]?.enabled !== false,
    [fields],
  );

  const isFieldRequired = useCallback(
    (fieldId: string): boolean => !!fields[fieldId]?.required,
    [fields],
  );

  const reloadConfig = useCallback(() => {}, []);
  const loadSettings = useCallback(() => settings, [settings]);

  return {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
    updateSettingsAsync,
    reloadConfig,
    mergeSettings,
    loadSettings,
    isFieldEnabled,
    isFieldRequired,
  } as ReturnType<typeof useModuleConfig<HasanatSettings>> &
    StandardModuleConfigExtraMap['hasanat'];
}`;

code = code.replace(/export function useHasanatConfig\(\) \{\n  return useStandardModuleConfig\('hasanat'\);\n\}/, useHasanatConfigReplacement);

fs.writeFileSync(file, code);
