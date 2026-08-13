import { z } from 'zod';
import type { TabDefinition } from './contactTypes.js';
import { DEFAULT_ACCOUNTING_SETTINGS, type AccountingSettings } from './accountingModuleSettings.js';
import { moduleFieldConfigPutBodySchema } from './moduleFieldConfigPutBodySchema.js';

/** PUT /api/accounting/field-config — field registry JSON without prefs keys. */
export const accountingFieldConfigPutBodySchema = moduleFieldConfigPutBodySchema;

/** PUT /api/accounting/preferences — strongly typed module preferences. */
export const accountingPreferencesPutBodySchema = z
  .object({
    currency: z.string().min(1).default('PKR'),
    currencySymbol: z.string().min(1).default('₨'),
    dateFormat: z.string().min(1).default('DD/MM/YYYY'),
    decimalSeparator: z.enum(['period', 'comma']).default('period'),
    decimalPlaces: z.number().int().min(0).max(4).default(2),
    fyStartMonth: z.string().min(1).default('July'),
    accountCodeLength: z.number().int().min(1).max(20).default(4),
    requireNarration: z.boolean().default(true),
    allowEditPosted: z.boolean().default(false),
    autoPostDrafts: z.boolean().default(false),
    retainedEarningsAccount: z.string().default('a3100'),
    organizationName: z.string().default('Al-Madrasa Al-Islamiyya'),
    defaultViewLayout: z.string().optional(),
  })
  .passthrough();

/** Typed preference state extracted from legacy AccountingSettings. */
export interface AccountingModulePreferences {
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  decimalSeparator: 'period' | 'comma';
  decimalPlaces: number;
  fyStartMonth: string;
  accountCodeLength: number;
  requireNarration: boolean;
  allowEditPosted: boolean;
  autoPostDrafts: boolean;
  retainedEarningsAccount: string;
  organizationName: string;
  defaultViewLayout?: string;
}

/** Default preferences. */
export const DEFAULT_ACCOUNTING_PREFERENCES: AccountingModulePreferences = {
  currency: DEFAULT_ACCOUNTING_SETTINGS.currency,
  currencySymbol: DEFAULT_ACCOUNTING_SETTINGS.currencySymbol,
  dateFormat: DEFAULT_ACCOUNTING_SETTINGS.dateFormat,
  decimalSeparator: DEFAULT_ACCOUNTING_SETTINGS.decimalSeparator,
  decimalPlaces: DEFAULT_ACCOUNTING_SETTINGS.decimalPlaces,
  fyStartMonth: DEFAULT_ACCOUNTING_SETTINGS.fyStartMonth,
  accountCodeLength: DEFAULT_ACCOUNTING_SETTINGS.accountCodeLength,
  requireNarration: DEFAULT_ACCOUNTING_SETTINGS.requireNarration,
  allowEditPosted: DEFAULT_ACCOUNTING_SETTINGS.allowEditPosted,
  autoPostDrafts: DEFAULT_ACCOUNTING_SETTINGS.autoPostDrafts,
  retainedEarningsAccount: DEFAULT_ACCOUNTING_SETTINGS.retainedEarningsAccount,
  organizationName: DEFAULT_ACCOUNTING_SETTINGS.organizationName,
  defaultViewLayout: DEFAULT_ACCOUNTING_SETTINGS.defaultViewLayout,
};

/** Normalizes raw DB JSON into strict typed preferences. */
export function normalizeAccountingModulePreferences(raw: unknown): AccountingModulePreferences {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_ACCOUNTING_PREFERENCES };
  }
  const safe = raw as Partial<AccountingModulePreferences>;
  return {
    currency: typeof safe.currency === 'string' ? safe.currency : DEFAULT_ACCOUNTING_PREFERENCES.currency,
    currencySymbol: typeof safe.currencySymbol === 'string' ? safe.currencySymbol : DEFAULT_ACCOUNTING_PREFERENCES.currencySymbol,
    dateFormat: typeof safe.dateFormat === 'string' ? safe.dateFormat : DEFAULT_ACCOUNTING_PREFERENCES.dateFormat,
    decimalSeparator: safe.decimalSeparator === 'comma' ? 'comma' : 'period',
    decimalPlaces: typeof safe.decimalPlaces === 'number' ? safe.decimalPlaces : DEFAULT_ACCOUNTING_PREFERENCES.decimalPlaces,
    fyStartMonth: typeof safe.fyStartMonth === 'string' ? safe.fyStartMonth : DEFAULT_ACCOUNTING_PREFERENCES.fyStartMonth,
    accountCodeLength: typeof safe.accountCodeLength === 'number' ? safe.accountCodeLength : DEFAULT_ACCOUNTING_PREFERENCES.accountCodeLength,
    requireNarration: typeof safe.requireNarration === 'boolean' ? safe.requireNarration : DEFAULT_ACCOUNTING_PREFERENCES.requireNarration,
    allowEditPosted: typeof safe.allowEditPosted === 'boolean' ? safe.allowEditPosted : DEFAULT_ACCOUNTING_PREFERENCES.allowEditPosted,
    autoPostDrafts: typeof safe.autoPostDrafts === 'boolean' ? safe.autoPostDrafts : DEFAULT_ACCOUNTING_PREFERENCES.autoPostDrafts,
    retainedEarningsAccount: typeof safe.retainedEarningsAccount === 'string' ? safe.retainedEarningsAccount : DEFAULT_ACCOUNTING_PREFERENCES.retainedEarningsAccount,
    organizationName: typeof safe.organizationName === 'string' ? safe.organizationName : DEFAULT_ACCOUNTING_PREFERENCES.organizationName,
    defaultViewLayout: typeof safe.defaultViewLayout === 'string' ? safe.defaultViewLayout : DEFAULT_ACCOUNTING_PREFERENCES.defaultViewLayout,
  };
}

/** Extracts field-config slice from a raw composed settings blob. */
export function normalizeAccountingSettings(raw: unknown): AccountingSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_ACCOUNTING_SETTINGS };
  }
  const safe = raw as Partial<AccountingSettings>;
  return {
    currency: DEFAULT_ACCOUNTING_SETTINGS.currency, // managed by preferences
    currencySymbol: DEFAULT_ACCOUNTING_SETTINGS.currencySymbol,
    dateFormat: DEFAULT_ACCOUNTING_SETTINGS.dateFormat,
    decimalSeparator: DEFAULT_ACCOUNTING_SETTINGS.decimalSeparator,
    decimalPlaces: DEFAULT_ACCOUNTING_SETTINGS.decimalPlaces,
    fyStartMonth: DEFAULT_ACCOUNTING_SETTINGS.fyStartMonth,
    accountCodeLength: DEFAULT_ACCOUNTING_SETTINGS.accountCodeLength,
    requireNarration: DEFAULT_ACCOUNTING_SETTINGS.requireNarration,
    allowEditPosted: DEFAULT_ACCOUNTING_SETTINGS.allowEditPosted,
    autoPostDrafts: DEFAULT_ACCOUNTING_SETTINGS.autoPostDrafts,
    retainedEarningsAccount: DEFAULT_ACCOUNTING_SETTINGS.retainedEarningsAccount,
    organizationName: DEFAULT_ACCOUNTING_SETTINGS.organizationName,
    defaultViewLayout: DEFAULT_ACCOUNTING_SETTINGS.defaultViewLayout,
    fields: safe.fields ?? DEFAULT_ACCOUNTING_SETTINGS.fields,
    customFields: Array.isArray(safe.customFields) ? safe.customFields : [],
    fieldOrder: Array.isArray(safe.fieldOrder) ? safe.fieldOrder : DEFAULT_ACCOUNTING_SETTINGS.fieldOrder,
    formTabs: Array.isArray(safe.formTabs) ? safe.formTabs : DEFAULT_ACCOUNTING_SETTINGS.formTabs,
    enabledTabs: Array.isArray(safe.enabledTabs) ? safe.enabledTabs : DEFAULT_ACCOUNTING_SETTINGS.enabledTabs,
    requiredTabs: Array.isArray(safe.requiredTabs) ? safe.requiredTabs : DEFAULT_ACCOUNTING_SETTINGS.requiredTabs,
  };
}

/** Recomposes preferences and field-config into the legacy flat settings shape. */
export function composeAccountingSettings(
  fieldConfig: AccountingSettings | null,
  prefs: AccountingModulePreferences,
  formTabs?: TabDefinition[]
): AccountingSettings {
  return {
    ...(fieldConfig ?? DEFAULT_ACCOUNTING_SETTINGS),
    currency: prefs.currency,
    currencySymbol: prefs.currencySymbol,
    dateFormat: prefs.dateFormat,
    decimalSeparator: prefs.decimalSeparator,
    decimalPlaces: prefs.decimalPlaces,
    fyStartMonth: prefs.fyStartMonth,
    accountCodeLength: prefs.accountCodeLength,
    requireNarration: prefs.requireNarration,
    allowEditPosted: prefs.allowEditPosted,
    autoPostDrafts: prefs.autoPostDrafts,
    retainedEarningsAccount: prefs.retainedEarningsAccount,
    organizationName: prefs.organizationName,
    defaultViewLayout: prefs.defaultViewLayout,
    ...(formTabs ? { formTabs } : {}),
  };
}

/** Drops preference keys before saving field-config to avoid overriding prefs layer. */
export function stripAccountingFieldConfigForPersist(
  config: Partial<AccountingSettings>
): Partial<AccountingSettings> {
  const { 
    currency,
    currencySymbol,
    dateFormat,
    decimalSeparator,
    decimalPlaces,
    fyStartMonth,
    accountCodeLength,
    requireNarration,
    allowEditPosted,
    autoPostDrafts,
    retainedEarningsAccount,
    organizationName,
    defaultViewLayout,
    ...fieldConfigOnly 
  } = config;
  return fieldConfigOnly;
}

export function mergeAccountingFormTabsFromApi(
  documentFormTabs: TabDefinition[] | undefined,
  apiTabs: TabDefinition[],
): TabDefinition[] {
  const documentOrDefault = documentFormTabs && documentFormTabs.length > 0 ? documentFormTabs : [];
  const merged =
    apiTabs.length === 0
      ? documentOrDefault
      : [
          ...apiTabs,
        ];
  const seenKeys = new Set<string>();
  return merged.filter((tab) => {
    if (!tab?.key || seenKeys.has(tab.key)) return false;
    seenKeys.add(tab.key);
    return true;
  });
}
