import { z } from 'zod';
import type { FieldDefinition, TabDefinition } from './contactTypes.js';
import {
  DEFAULT_TEACHERS_SETTINGS,
  type TeachersSettings,
} from './teachersModuleSettings.js';
import { TEACHERS_TAB_REGISTRY } from './moduleFieldSetupPersons.js';
import { moduleFieldConfigPutBodySchema } from './moduleFieldConfigPutBodySchema.js';

/** PUT /api/teachers/field-config — field registry JSON without formTabs SSOT. */
export const teacherFieldConfigPutBodySchema = moduleFieldConfigPutBodySchema
  .extend({
    columnRegistry: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();

/** PUT /api/teachers/preferences — employee ID / contact-link prefs only. */
export const teacherPreferencesPutBodySchema = z
  .object({
    idPrefix: z.string().optional(),
    autoGenerateId: z.boolean().optional(),
    requireContactLink: z.boolean().optional(),
    defaultSpecialization: z.string().optional(),
  })
  .passthrough();

export type TeacherModulePreferences = Pick<
  TeachersSettings,
  | 'idPrefix'
  | 'autoGenerateId'
  | 'requireContactLink'
  | 'defaultSpecialization'
>;

const PREF_KEYS = [
  'idPrefix',
  'autoGenerateId',
  'requireContactLink',
  'defaultSpecialization',
] as const;

/** Normalize Teachers module preferences (typed `teacher_module_preferences`). */
export function normalizeTeacherModulePreferences(
  partial?: Partial<TeacherModulePreferences> | Record<string, unknown> | null,
): TeacherModulePreferences {
  const defaults: TeacherModulePreferences = {
    idPrefix: DEFAULT_TEACHERS_SETTINGS.idPrefix,
    autoGenerateId: DEFAULT_TEACHERS_SETTINGS.autoGenerateId,
    requireContactLink: DEFAULT_TEACHERS_SETTINGS.requireContactLink,
    defaultSpecialization: DEFAULT_TEACHERS_SETTINGS.defaultSpecialization,
  };
  if (!partial || typeof partial !== 'object') return { ...defaults };

  return {
    idPrefix:
      typeof partial.idPrefix === 'string' && partial.idPrefix.trim()
        ? partial.idPrefix.trim()
        : defaults.idPrefix,
    autoGenerateId:
      typeof partial.autoGenerateId === 'boolean'
        ? partial.autoGenerateId
        : defaults.autoGenerateId,
    requireContactLink:
      typeof partial.requireContactLink === 'boolean'
        ? partial.requireContactLink
        : defaults.requireContactLink,
    defaultSpecialization:
      typeof partial.defaultSpecialization === 'string' && partial.defaultSpecialization.trim()
        ? partial.defaultSpecialization
        : defaults.defaultSpecialization,
  };
}

/** Field-config slice persisted on `teacher_field_configs` (never formTabs / module prefs). */
export function stripTeacherFieldConfigForPersist(
  config: TeachersSettings | Record<string, unknown>,
): Record<string, unknown> {
  const {
    formTabs: _formTabs,
    idPrefix: _idPrefix,
    autoGenerateId: _autoGenerateId,
    requireContactLink: _requireContactLink,
    defaultSpecialization: _defaultSpecialization,
    defaultViewLayout: _defaultViewLayout,
    ...rest
  } = config as TeachersSettings & Record<string, unknown>;
  return rest;
}

/** Normalize TeachersSettings from typed REST or legacy document blobs. */
export function normalizeTeachersSettings(config: unknown): TeachersSettings {
  const defaults = { ...DEFAULT_TEACHERS_SETTINGS, formTabs: [...TEACHERS_TAB_REGISTRY] };
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { ...defaults };
  }
  const raw = config as Record<string, unknown>;
  const prefs = normalizeTeacherModulePreferences(raw);
  const merged: TeachersSettings = {
    ...defaults,
    ...(raw as Partial<TeachersSettings>),
    ...prefs,
    fieldOrder: Array.isArray(raw.fieldOrder)
      ? (raw.fieldOrder as string[])
      : defaults.fieldOrder,
    formTabs: Array.isArray(raw.formTabs)
      ? (raw.formTabs as TabDefinition[])
      : defaults.formTabs,
    enabledTabs: Array.isArray(raw.enabledTabs) ? (raw.enabledTabs as string[]) : raw.enabledTabs as string[] | undefined,
    requiredTabs: Array.isArray(raw.requiredTabs) ? (raw.requiredTabs as string[]) : raw.requiredTabs as string[] | undefined,
    fields:
      raw.fields && typeof raw.fields === 'object' && !Array.isArray(raw.fields)
        ? (raw.fields as TeachersSettings['fields'])
        : defaults.fields,
    columnRegistry: Array.isArray(raw.columnRegistry)
      ? (raw.columnRegistry as TeachersSettings['columnRegistry'])
      : raw.columnRegistry as TeachersSettings['columnRegistry'],
  };
  // Retired Setup preferences — Work uses useWorkDirectoryViewMode (Students parity),
  // and legacy `customFields[]` is superseded by tabbed `fields`.
  delete (merged as TeachersSettings & { defaultViewLayout?: unknown }).defaultViewLayout;
  delete (merged as TeachersSettings & { customFields?: unknown }).customFields;
  return merged;
}

/** Split a legacy `teachers_settings` blob into typed field-config + preferences rows. */
export function splitTeachersSettingsBlob(raw: unknown): {
  fieldConfig: Record<string, unknown>;
  preferences: TeacherModulePreferences;
} {
  const settings = normalizeTeachersSettings(raw);
  return {
    fieldConfig: stripTeacherFieldConfigForPersist(settings),
    preferences: normalizeTeacherModulePreferences(settings),
  };
}

/** Compose FE/validation TeachersSettings from typed parts (+ optional custom tabs). */
export function composeTeachersSettings(
  fieldConfig: unknown,
  preferences: unknown,
  formTabs?: TabDefinition[],
): TeachersSettings {
  const prefs = normalizeTeacherModulePreferences(
    preferences as Partial<TeacherModulePreferences> | null,
  );
  return normalizeTeachersSettings({
    ...(fieldConfig && typeof fieldConfig === 'object' && !Array.isArray(fieldConfig)
      ? (fieldConfig as Record<string, unknown>)
      : {}),
    ...prefs,
    ...(formTabs ? { formTabs } : {}),
  });
}

/**
 * Merge API custom_tabs with document/default form tabs for Teachers Setup/forms.
 * Empty API → document tabs when present, else {@link TEACHERS_TAB_REGISTRY}.
 */
export function mergeTeachersFormTabsFromApi(
  documentFormTabs: TabDefinition[] | undefined,
  apiTabs: TabDefinition[],
  _fields?: Record<string, FieldDefinition[]> | undefined,
): TabDefinition[] {
  const documentOrDefault =
    documentFormTabs && documentFormTabs.length > 0
      ? documentFormTabs
      : [...TEACHERS_TAB_REGISTRY];

  const merged =
    apiTabs.length === 0
      ? documentOrDefault
      : [
          ...apiTabs,
          ...TEACHERS_TAB_REGISTRY.filter(
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

export { PREF_KEYS as TEACHER_MODULE_PREFERENCE_KEYS };
