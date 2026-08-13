const fs = require('fs');
const path = '/Users/syedaalin/Documents/mms/apps/frontend/src/hooks/useStandardModuleConfig.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Enrollments
const enrollmentsRegex = /export function useEnrollmentConfig\(\) \{[\s\S]*?return \{\s*settings,[\s\S]*?\} as ReturnType<typeof useModuleConfig<EnrollmentsSettings>> &\s*StandardModuleConfigExtraMap\['enrollments'\];\s*\}/;
const enrollmentsReplacement = `const useEnrollmentConfigImpl = createStandardModuleConfigHook<
  EnrollmentsSettings,
  Record<string, never>
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.enrollments.defaultSettings as EnrollmentsSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.enrollments.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedEnrollmentsSettings,
  useFieldConfigMutation: useEnrollmentFieldConfigMutation,
  usePreferencesMutation: useEnrollmentPreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setEnrollmentFieldConfigMemory,
  setPreferencesMemory: setEnrollmentPreferencesMemory as unknown as (prefs: unknown) => void,
  fieldConfigQueryKey: ENROLLMENTS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: ENROLLMENTS_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeEnrollmentsSettings,
  normalizePrefs: normalizeEnrollmentModulePreferences as unknown as (
    settings: EnrollmentsSettings,
  ) => unknown,
  composeSettings: (merged, prefs, tabs) =>
    composeEnrollmentsSettings(
      merged as EnrollmentsSettings,
      prefs as any,
      tabs as any,
    ),
  lookupsFrom: function useEnrollmentConfigLookups() {
    return {};
  },
});

export function useEnrollmentConfig() {
  return useEnrollmentConfigImpl() as StandardModuleConfigCore<EnrollmentsSettings> &
    StandardModuleConfigExtraMap['enrollments'];
}`;

content = content.replace(enrollmentsRegex, enrollmentsReplacement);

// 2. Examinations
const examinationsRegex = /export function useExaminationConfig\(\) \{[\s\S]*?return \{\s*settings,[\s\S]*?\} as ReturnType<typeof useModuleConfig<ExaminationsSettings>> &\s*StandardModuleConfigExtraMap\['examinations'\];\s*\}/;
const examinationsReplacement = `const useExaminationConfigImpl = createStandardModuleConfigHook<
  ExaminationsSettings,
  Record<string, never>
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.examinations.defaultSettings as ExaminationsSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.examinations.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedExaminationsSettings,
  useFieldConfigMutation: useExaminationFieldConfigMutation,
  usePreferencesMutation: useExaminationPreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setExaminationFieldConfigMemory,
  setPreferencesMemory: setExaminationPreferencesMemory as unknown as (prefs: unknown) => void,
  fieldConfigQueryKey: EXAMINATIONS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: EXAMINATIONS_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeExaminationsSettings,
  normalizePrefs: normalizeExaminationsModulePreferences as unknown as (
    settings: ExaminationsSettings,
  ) => unknown,
  composeSettings: (merged, prefs, tabs) =>
    composeExaminationsSettings(
      merged as ExaminationsSettings,
      prefs as any,
      tabs as any,
    ),
  lookupsFrom: function useExaminationConfigLookups() {
    return {};
  },
});

export function useExaminationConfig() {
  return useExaminationConfigImpl() as StandardModuleConfigCore<ExaminationsSettings> &
    StandardModuleConfigExtraMap['examinations'];
}`;

content = content.replace(examinationsRegex, examinationsReplacement);

// 3. Hasanat
const hasanatRegex = /export function useHasanatConfig\(\) \{[\s\S]*?return \{\s*settings,[\s\S]*?\} as ReturnType<typeof useModuleConfig<HasanatSettings>> &\s*StandardModuleConfigExtraMap\['hasanat'\];\s*\}/;
const hasanatReplacement = `const useHasanatConfigImpl = createStandardModuleConfigHook<
  HasanatSettings,
  Record<string, never>
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.hasanat.defaultSettings as HasanatSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.hasanat.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedHasanatSettings,
  useFieldConfigMutation: useHasanatFieldConfigMutation,
  usePreferencesMutation: useHasanatPreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setHasanatFieldConfigMemory,
  setPreferencesMemory: setHasanatPreferencesMemory as unknown as (prefs: unknown) => void,
  fieldConfigQueryKey: HASANAT_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: HASANAT_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeHasanatSettings,
  normalizePrefs: normalizeHasanatModulePreferences as unknown as (
    settings: HasanatSettings,
  ) => unknown,
  composeSettings: (merged, prefs, tabs) =>
    composeHasanatSettings(
      merged as HasanatSettings,
      prefs as any,
      tabs as any,
    ),
  lookupsFrom: function useHasanatConfigLookups() {
    return {};
  },
});

export function useHasanatConfig() {
  return useHasanatConfigImpl() as StandardModuleConfigCore<HasanatSettings> &
    StandardModuleConfigExtraMap['hasanat'];
}`;

content = content.replace(hasanatRegex, hasanatReplacement);

// 4. Finance
const financeRegex = /export function useFinanceConfig\(\) \{[\s\S]*?return \{\s*settings,[\s\S]*?\} as ReturnType<typeof useModuleConfig<FinanceSettings>> &\s*StandardModuleConfigExtraMap\['finance'\];\s*\}/;
const financeReplacement = `const useFinanceConfigImpl = createStandardModuleConfigHook<
  FinanceSettings,
  Record<string, never>
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.finance.defaultSettings as FinanceSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.finance.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedFinanceSettings,
  useFieldConfigMutation: useFinanceFieldConfigMutation,
  usePreferencesMutation: useFinancePreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setFinanceFieldConfigMemory,
  setPreferencesMemory: setFinancePreferencesMemory as unknown as (prefs: unknown) => void,
  fieldConfigQueryKey: FINANCE_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: FINANCE_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeFinanceSettings,
  normalizePrefs: normalizeFinanceModulePreferences as unknown as (
    settings: FinanceSettings,
  ) => unknown,
  composeSettings: (merged, prefs, tabs) =>
    composeFinanceSettings(
      merged as FinanceSettings,
      prefs as any,
      tabs as any,
    ),
  lookupsFrom: function useFinanceConfigLookups() {
    return {};
  },
});

export function useFinanceConfig() {
  return useFinanceConfigImpl() as StandardModuleConfigCore<FinanceSettings> &
    StandardModuleConfigExtraMap['finance'];
}`;

content = content.replace(financeRegex, financeReplacement);

// 5. Accounting
const accountingRegex = /export function useAccountingConfig\(\) \{[\s\S]*?return \{\s*settings,[\s\S]*?\} as ReturnType<typeof useModuleConfig<AccountingSettings>> &\s*StandardModuleConfigExtraMap\['accounting'\];\s*\}/;
const accountingReplacement = `const useAccountingConfigImpl = createStandardModuleConfigHook<
  AccountingSettings,
  Record<string, never>
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.accounting.defaultSettings as AccountingSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.accounting.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedAccountingSettings,
  useFieldConfigMutation: useAccountingFieldConfigMutation,
  usePreferencesMutation: useAccountingPreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setAccountingFieldConfigMemory,
  setPreferencesMemory: setAccountingPreferencesMemory as unknown as (prefs: unknown) => void,
  fieldConfigQueryKey: ACCOUNTING_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: ACCOUNTING_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeAccountingSettings,
  normalizePrefs: normalizeAccountingModulePreferences as unknown as (
    settings: AccountingSettings,
  ) => unknown,
  composeSettings: (merged, prefs, tabs) =>
    composeAccountingSettings(
      merged as AccountingSettings,
      prefs as any,
      tabs as any,
    ),
  lookupsFrom: function useAccountingConfigLookups() {
    return {};
  },
});

export function useAccountingConfig() {
  return useAccountingConfigImpl() as StandardModuleConfigCore<AccountingSettings> &
    StandardModuleConfigExtraMap['accounting'];
}`;

content = content.replace(accountingRegex, accountingReplacement);

fs.writeFileSync(path, content, 'utf8');
