import { z } from 'zod';
import type { FieldDefinition, TabDefinition } from './contactTypes.js';
import {
  DEFAULT_ENROLLMENTS_SETTINGS,
  type EnrollmentsSettings,
} from './enrollmentsModuleSettings.js';
import { ENROLLMENTS_TAB_REGISTRY } from './moduleFieldSetupAcademic.js';
import { moduleFieldConfigPutBodySchema } from './moduleFieldConfigPutBodySchema.js';

/** PUT /api/enrollments/field-config — field registry JSON without formTabs SSOT. */
export const enrollmentFieldConfigPutBodySchema = moduleFieldConfigPutBodySchema
  .extend({
    columnRegistry: z.array(z.record(z.string(), z.unknown())).optional(),
    customFields: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();

/** PUT /api/enrollments/preferences — enrollment prefs only. */
export const enrollmentPreferencesPutBodySchema = z
  .object({
    maxStudentsPerClass: z.string().optional(),
    waitlistEnabled: z.boolean().optional(),
    requireEligibilityCheck: z.boolean().optional(),
    autoAssignClass: z.boolean().optional(),
    enrollmentApproval: z.boolean().optional(),
    allowTransfers: z.boolean().optional(),
    dropDeadlineDays: z.string().optional(),
    reenrollmentReminder: z.boolean().optional(),
    defaultViewLayout: z.string().optional(),
  })
  .passthrough();

export type EnrollmentModulePreferences = Pick<
  EnrollmentsSettings,
  | 'maxStudentsPerClass'
  | 'waitlistEnabled'
  | 'requireEligibilityCheck'
  | 'autoAssignClass'
  | 'enrollmentApproval'
  | 'allowTransfers'
  | 'dropDeadlineDays'
  | 'reenrollmentReminder'
  | 'defaultViewLayout'
>;

const PREF_KEYS = [
  'maxStudentsPerClass',
  'waitlistEnabled',
  'requireEligibilityCheck',
  'autoAssignClass',
  'enrollmentApproval',
  'allowTransfers',
  'dropDeadlineDays',
  'reenrollmentReminder',
  'defaultViewLayout',
] as const;

function normalizeViewLayout(value: string | undefined): string {
  const trimmed = value?.trim();
  if (trimmed === 'table' || trimmed === 'cards' || trimmed === 'list') return trimmed;
  return DEFAULT_ENROLLMENTS_SETTINGS.defaultViewLayout ?? 'list';
}

/** Normalize Enrollments module preferences (typed `enrollment_module_preferences`). */
export function normalizeEnrollmentModulePreferences(
  partial?: Partial<EnrollmentModulePreferences> | Record<string, unknown> | null,
): EnrollmentModulePreferences {
  const defaults: EnrollmentModulePreferences = {
    maxStudentsPerClass: DEFAULT_ENROLLMENTS_SETTINGS.maxStudentsPerClass,
    waitlistEnabled: DEFAULT_ENROLLMENTS_SETTINGS.waitlistEnabled,
    requireEligibilityCheck: DEFAULT_ENROLLMENTS_SETTINGS.requireEligibilityCheck,
    autoAssignClass: DEFAULT_ENROLLMENTS_SETTINGS.autoAssignClass,
    enrollmentApproval: DEFAULT_ENROLLMENTS_SETTINGS.enrollmentApproval,
    allowTransfers: DEFAULT_ENROLLMENTS_SETTINGS.allowTransfers,
    dropDeadlineDays: DEFAULT_ENROLLMENTS_SETTINGS.dropDeadlineDays,
    reenrollmentReminder: DEFAULT_ENROLLMENTS_SETTINGS.reenrollmentReminder,
    defaultViewLayout: DEFAULT_ENROLLMENTS_SETTINGS.defaultViewLayout,
  };
  if (!partial || typeof partial !== 'object') return { ...defaults };

  return {
    maxStudentsPerClass:
      typeof partial.maxStudentsPerClass === 'string' && partial.maxStudentsPerClass.trim()
        ? partial.maxStudentsPerClass.trim()
        : defaults.maxStudentsPerClass,
    waitlistEnabled:
      typeof partial.waitlistEnabled === 'boolean'
        ? partial.waitlistEnabled
        : defaults.waitlistEnabled,
    requireEligibilityCheck:
      typeof partial.requireEligibilityCheck === 'boolean'
        ? partial.requireEligibilityCheck
        : defaults.requireEligibilityCheck,
    autoAssignClass:
      typeof partial.autoAssignClass === 'boolean'
        ? partial.autoAssignClass
        : defaults.autoAssignClass,
    enrollmentApproval:
      typeof partial.enrollmentApproval === 'boolean'
        ? partial.enrollmentApproval
        : defaults.enrollmentApproval,
    allowTransfers:
      typeof partial.allowTransfers === 'boolean'
        ? partial.allowTransfers
        : defaults.allowTransfers,
    dropDeadlineDays:
      typeof partial.dropDeadlineDays === 'string' && partial.dropDeadlineDays.trim()
        ? partial.dropDeadlineDays.trim()
        : defaults.dropDeadlineDays,
    reenrollmentReminder:
      typeof partial.reenrollmentReminder === 'boolean'
        ? partial.reenrollmentReminder
        : defaults.reenrollmentReminder,
    defaultViewLayout: normalizeViewLayout(
      typeof partial.defaultViewLayout === 'string'
        ? partial.defaultViewLayout
        : defaults.defaultViewLayout,
    ),
  };
}

/** Field-config slice persisted on `enrollment_field_configs` (never formTabs / module prefs). */
export function stripEnrollmentFieldConfigForPersist(
  config: EnrollmentsSettings | Record<string, unknown>,
): Record<string, unknown> {
  const {
    formTabs: _formTabs,
    maxStudentsPerClass: _maxStudentsPerClass,
    waitlistEnabled: _waitlistEnabled,
    requireEligibilityCheck: _requireEligibilityCheck,
    autoAssignClass: _autoAssignClass,
    enrollmentApproval: _enrollmentApproval,
    allowTransfers: _allowTransfers,
    dropDeadlineDays: _dropDeadlineDays,
    reenrollmentReminder: _reenrollmentReminder,
    defaultViewLayout: _defaultViewLayout,
    ...rest
  } = config as EnrollmentsSettings & Record<string, unknown>;
  return rest;
}

/** Normalize EnrollmentsSettings from typed REST or legacy document blobs. */
export function normalizeEnrollmentsSettings(config: unknown): EnrollmentsSettings {
  const defaults = { ...DEFAULT_ENROLLMENTS_SETTINGS, formTabs: [...ENROLLMENTS_TAB_REGISTRY] };
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { ...defaults };
  }
  const raw = config as Record<string, unknown>;
  const prefs = normalizeEnrollmentModulePreferences(raw);
  return {
    ...defaults,
    ...(raw as Partial<EnrollmentsSettings>),
    ...prefs,
    customFields: Array.isArray(raw.customFields)
      ? (raw.customFields as EnrollmentsSettings['customFields'])
      : defaults.customFields,
    fieldOrder: Array.isArray(raw.fieldOrder)
      ? (raw.fieldOrder as string[])
      : defaults.fieldOrder,
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
      raw.fields && typeof raw.fields === 'object' && !Array.isArray(raw.fields)
        ? (raw.fields as EnrollmentsSettings['fields'])
        : defaults.fields,
  };
}

/** Split a legacy `enrollments_settings` blob into typed field-config + preferences rows. */
export function splitEnrollmentsSettingsBlob(raw: unknown): {
  fieldConfig: Record<string, unknown>;
  preferences: EnrollmentModulePreferences;
} {
  const settings = normalizeEnrollmentsSettings(raw);
  return {
    fieldConfig: stripEnrollmentFieldConfigForPersist(settings),
    preferences: normalizeEnrollmentModulePreferences(settings),
  };
}

/** Compose FE/validation EnrollmentsSettings from typed parts (+ optional custom tabs). */
export function composeEnrollmentsSettings(
  fieldConfig: unknown,
  preferences: unknown,
  formTabs?: TabDefinition[],
): EnrollmentsSettings {
  const prefs = normalizeEnrollmentModulePreferences(
    preferences as Partial<EnrollmentModulePreferences> | null,
  );
  return normalizeEnrollmentsSettings({
    ...(fieldConfig && typeof fieldConfig === 'object' && !Array.isArray(fieldConfig)
      ? (fieldConfig as Record<string, unknown>)
      : {}),
    ...prefs,
    ...(formTabs ? { formTabs } : {}),
  });
}

/**
 * Merge API custom_tabs with document/default form tabs for Enrollments Setup/forms.
 */
export function mergeEnrollmentsFormTabsFromApi(
  documentFormTabs: TabDefinition[] | undefined,
  apiTabs: TabDefinition[],
  _fields?: Record<string, FieldDefinition[]> | undefined,
): TabDefinition[] {
  const documentOrDefault =
    documentFormTabs && documentFormTabs.length > 0
      ? documentFormTabs
      : [...ENROLLMENTS_TAB_REGISTRY];

  const merged =
    apiTabs.length === 0
      ? documentOrDefault
      : [
          ...apiTabs,
          ...ENROLLMENTS_TAB_REGISTRY.filter(
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

export { PREF_KEYS as ENROLLMENT_MODULE_PREFERENCE_KEYS };
