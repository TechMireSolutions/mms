import { z } from 'zod';
import type { TabDefinition } from './contactTypes.js';
import { DEFAULT_FINANCE_SETTINGS, type FinanceSettings } from './financeModuleSettings.js';
import { FINANCE_TAB_REGISTRY } from './moduleFieldSetupFinance.js';
import { moduleFieldConfigPutBodySchema } from './moduleFieldConfigPutBodySchema.js';

/** PUT /api/finance/field-config — field registry JSON without prefs keys. */
export const financeFieldConfigPutBodySchema = moduleFieldConfigPutBodySchema
  .extend({
    customFields: z.array(z.record(z.string(), z.unknown())).optional(),
    fieldOrder: z.array(z.string()).optional(),
    formTabs: z.array(z.record(z.string(), z.unknown())).optional(),
    enabledTabs: z.array(z.string()).optional(),
    requiredTabs: z.array(z.string()).optional(),
  })
  .passthrough();

/** PUT /api/finance/preferences — finance prefs only. */
export const financePreferencesPutBodySchema = z
  .object({
    currency: z.string().optional(),
    invoicePrefix: z.string().optional(),
    dueDays: z.string().optional(),
    lateFeePercent: z.string().optional(),
    taxRate: z.string().optional(),
    paymentMethods: z.array(z.string()).optional(),
    autoGenerateInvoice: z.boolean().optional(),
    sendInvoiceEmail: z.boolean().optional(),
    allowPartialPayment: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    overdueReminder: z.boolean().optional(),
    reminderDaysBefore: z.string().optional(),
    feeReminders: z.boolean().optional(),
    defaultViewLayout: z.string().optional(),
  })
  .passthrough();

export type FinanceModulePreferences = Pick<
  FinanceSettings,
  | 'currency'
  | 'invoicePrefix'
  | 'dueDays'
  | 'lateFeePercent'
  | 'taxRate'
  | 'paymentMethods'
  | 'autoGenerateInvoice'
  | 'sendInvoiceEmail'
  | 'allowPartialPayment'
  | 'requireApproval'
  | 'overdueReminder'
  | 'reminderDaysBefore'
  | 'feeReminders'
  | 'defaultViewLayout'
>;

const PREF_KEYS = [
  'currency',
  'invoicePrefix',
  'dueDays',
  'lateFeePercent',
  'taxRate',
  'paymentMethods',
  'autoGenerateInvoice',
  'sendInvoiceEmail',
  'allowPartialPayment',
  'requireApproval',
  'overdueReminder',
  'reminderDaysBefore',
  'feeReminders',
  'defaultViewLayout',
] as const;

function normalizeViewLayout(value: string | undefined): string {
  const trimmed = value?.trim();
  if (trimmed === 'table' || trimmed === 'cards' || trimmed === 'list') return trimmed;
  return DEFAULT_FINANCE_SETTINGS.defaultViewLayout ?? 'list';
}

function normalizeStr(v: unknown, def: string): string {
  return typeof v === 'string' && v.trim() ? v.trim() : def;
}

function normalizeBool(v: unknown, def: boolean): boolean {
  return typeof v === 'boolean' ? v : def;
}

function normalizeStrArr(v: unknown, def: string[]): string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : def;
}

/** Normalize Finance module preferences (typed `finance_module_preferences`). */
export function normalizeFinanceModulePreferences(
  partial?: Partial<FinanceModulePreferences> | Record<string, unknown> | null,
): FinanceModulePreferences {
  const d = DEFAULT_FINANCE_SETTINGS;
  const p = (partial ?? {}) as Record<string, unknown>;
  return {
    currency: normalizeStr(p.currency, d.currency),
    invoicePrefix: normalizeStr(p.invoicePrefix, d.invoicePrefix),
    dueDays: normalizeStr(p.dueDays, d.dueDays),
    lateFeePercent: normalizeStr(p.lateFeePercent, d.lateFeePercent),
    taxRate: normalizeStr(p.taxRate, d.taxRate),
    paymentMethods: normalizeStrArr(p.paymentMethods, d.paymentMethods),
    autoGenerateInvoice: normalizeBool(p.autoGenerateInvoice, d.autoGenerateInvoice),
    sendInvoiceEmail: normalizeBool(p.sendInvoiceEmail, d.sendInvoiceEmail),
    allowPartialPayment: normalizeBool(p.allowPartialPayment, d.allowPartialPayment),
    requireApproval: normalizeBool(p.requireApproval, d.requireApproval),
    overdueReminder: normalizeBool(p.overdueReminder, d.overdueReminder),
    reminderDaysBefore: normalizeStr(p.reminderDaysBefore, d.reminderDaysBefore),
    feeReminders: normalizeBool(p.feeReminders, d.feeReminders),
    defaultViewLayout: normalizeViewLayout(
      typeof p.defaultViewLayout === 'string' ? p.defaultViewLayout : d.defaultViewLayout,
    ),
  };
}

/** Strip prefs keys before persisting to `finance_field_configs`. */
export function stripFinanceFieldConfigForPersist(
  config: FinanceSettings | Record<string, unknown>,
): Record<string, unknown> {
  const { formTabs: _f, ...rest } = config as FinanceSettings & Record<string, unknown>;
  const out = { ...rest } as Record<string, unknown>;
  for (const key of PREF_KEYS) delete out[key];
  return out;
}

/** Normalize FinanceSettings from typed REST or legacy document blobs. */
export function normalizeFinanceSettings(config: unknown): FinanceSettings {
  const defaults: FinanceSettings = { ...DEFAULT_FINANCE_SETTINGS, formTabs: [...FINANCE_TAB_REGISTRY] };
  if (!config || typeof config !== 'object' || Array.isArray(config)) return { ...defaults };
  const raw = config as Record<string, unknown>;
  const prefs = normalizeFinanceModulePreferences(raw);
  return {
    ...defaults,
    ...(raw as Partial<FinanceSettings>),
    ...prefs,
    customFields: Array.isArray(raw.customFields)
      ? (raw.customFields as FinanceSettings['customFields'])
      : defaults.customFields,
    fieldOrder: Array.isArray(raw.fieldOrder) ? (raw.fieldOrder as string[]) : defaults.fieldOrder,
    formTabs: Array.isArray(raw.formTabs)
      ? (raw.formTabs as TabDefinition[])
      : defaults.formTabs,
    enabledTabs: Array.isArray(raw.enabledTabs)
      ? (raw.enabledTabs as string[])
      : (raw.enabledTabs as string[] | undefined),
    requiredTabs: Array.isArray(raw.requiredTabs)
      ? (raw.requiredTabs as string[])
      : (raw.requiredTabs as string[] | undefined),
    fields:
      raw.fields &&
      typeof raw.fields === 'object' &&
      !Array.isArray(raw.fields) &&
      Object.keys(raw.fields).length > 0
        ? (raw.fields as FinanceSettings['fields'])
        : defaults.fields,
  };
}

/** Split a legacy `finance_settings` blob into typed field-config + preferences rows. */
export function splitFinanceSettingsBlob(raw: unknown): {
  fieldConfig: Record<string, unknown>;
  preferences: FinanceModulePreferences;
} {
  const settings = normalizeFinanceSettings(raw);
  return {
    fieldConfig: stripFinanceFieldConfigForPersist(settings),
    preferences: normalizeFinanceModulePreferences(settings),
  };
}

/** Compose FE/validation FinanceSettings from typed parts (+ optional custom tabs). */
export function composeFinanceSettings(
  fieldConfig: unknown,
  preferences: unknown,
  formTabs?: TabDefinition[],
): FinanceSettings {
  const prefs = normalizeFinanceModulePreferences(
    preferences as Partial<FinanceModulePreferences> | null,
  );
  return normalizeFinanceSettings({
    ...(fieldConfig && typeof fieldConfig === 'object' && !Array.isArray(fieldConfig)
      ? (fieldConfig as Record<string, unknown>)
      : {}),
    ...prefs,
    ...(formTabs ? { formTabs } : {}),
  });
}

/** Merge API custom_tabs with document/default form tabs for Finance. */
export function mergeFinanceFormTabsFromApi(
  documentFormTabs: TabDefinition[] | undefined,
  apiTabs: TabDefinition[],
): TabDefinition[] {
  const documentOrDefault =
    documentFormTabs && documentFormTabs.length > 0 ? documentFormTabs : [...FINANCE_TAB_REGISTRY];
  const merged =
    apiTabs.length === 0
      ? documentOrDefault
      : [
          ...apiTabs,
          ...FINANCE_TAB_REGISTRY.filter(
            (seedTab) => !apiTabs.some((apiTab) => apiTab.key === seedTab.key),
          ),
        ];
  const seenKeys = new Set<string>();
  return merged.filter((tab) => {
    if (!tab?.key || seenKeys.has(tab.key)) return false;
    seenKeys.add(tab.key);
    return true;
  });
}

export { PREF_KEYS as FINANCE_MODULE_PREFERENCE_KEYS };
