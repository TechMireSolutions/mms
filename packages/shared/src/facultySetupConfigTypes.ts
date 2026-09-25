import { z } from 'zod';
import type { FieldDefinition, TabDefinition } from './contactTypes.js';
import {
  DEFAULT_TEACHERS_SETTINGS,
  type TeachersSettings,
} from './facultyModuleSettings.js';
import { TEACHERS_TAB_REGISTRY } from './moduleFieldSetupPersons.js';
import { moduleFieldConfigPutBodyBaseSchema } from './schemas/moduleFieldConfig.dto.js';
import { deepSanitizeStrings } from './schemas/sanitize.js';

/** PUT /api/teachers/field-config — field registry JSON without formTabs SSOT. */
const teacherFieldConfigPutBodyBaseSchema = moduleFieldConfigPutBodyBaseSchema
  .extend({
    columnRegistry: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .strict();

export const teacherFieldConfigPutBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, teacherFieldConfigPutBodyBaseSchema);

/** PUT /api/teachers/preferences — employee ID / contact-link prefs only. */
export const teacherPreferencesPutBodySchema = z
  .object({
    idPrefix: z.string().optional(),
    idTemplate: z.string().optional(),
    idDigits: z.number().optional(),
    idStartSeq: z.number().optional(),
    idRestartAnnually: z.boolean().optional(),
    employeeIdPrefix: z.string().optional(),
    employeeIdYearFormat: z.enum(['YYYY', 'YY']).optional(),
    employeeIdSequenceDigits: z.number().int().min(2).max(8).optional(),
    employeeIdDelimiter: z.string().optional(),
    employeeIdLastYear: z.number().optional(),
    employeeIdCurrentSequence: z.number().optional(),
    autoGenerateId: z.boolean().optional(),
    requireContactLink: z.boolean().optional(),
    defaultSpecialization: z.string().optional(),
  })
  .passthrough();

export type TeacherModulePreferences = Pick<
  TeachersSettings,
  | 'idPrefix'
  | 'idTemplate'
  | 'idDigits'
  | 'idStartSeq'
  | 'idRestartAnnually'
  | 'employeeIdPrefix'
  | 'employeeIdYearFormat'
  | 'employeeIdSequenceDigits'
  | 'employeeIdDelimiter'
  | 'employeeIdLastYear'
  | 'employeeIdCurrentSequence'
  | 'autoGenerateId'
  | 'requireContactLink'
  | 'defaultSpecialization'
>;

const PREF_KEYS = [
  'idPrefix',
  'idTemplate',
  'idDigits',
  'idStartSeq',
  'idRestartAnnually',
  'employeeIdPrefix',
  'employeeIdYearFormat',
  'employeeIdSequenceDigits',
  'employeeIdDelimiter',
  'employeeIdLastYear',
  'employeeIdCurrentSequence',
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
    idTemplate: DEFAULT_TEACHERS_SETTINGS.idTemplate ?? '{PREFIX}-{SEQ}',
    idDigits: DEFAULT_TEACHERS_SETTINGS.idDigits ?? 4,
    idStartSeq: DEFAULT_TEACHERS_SETTINGS.idStartSeq ?? 1,
    idRestartAnnually: DEFAULT_TEACHERS_SETTINGS.idRestartAnnually ?? false,
    employeeIdPrefix: DEFAULT_TEACHERS_SETTINGS.employeeIdPrefix ?? 'FAC',
    employeeIdYearFormat: DEFAULT_TEACHERS_SETTINGS.employeeIdYearFormat ?? 'YYYY',
    employeeIdSequenceDigits: DEFAULT_TEACHERS_SETTINGS.employeeIdSequenceDigits ?? 4,
    employeeIdDelimiter: DEFAULT_TEACHERS_SETTINGS.employeeIdDelimiter ?? '',
    employeeIdLastYear: DEFAULT_TEACHERS_SETTINGS.employeeIdLastYear,
    employeeIdCurrentSequence: DEFAULT_TEACHERS_SETTINGS.employeeIdCurrentSequence ?? 0,
    autoGenerateId: DEFAULT_TEACHERS_SETTINGS.autoGenerateId,
    requireContactLink: DEFAULT_TEACHERS_SETTINGS.requireContactLink,
    defaultSpecialization: DEFAULT_TEACHERS_SETTINGS.defaultSpecialization,
  };
  if (!partial || typeof partial !== 'object') return { ...defaults };

  const rawPrefix = partial.employeeIdPrefix ?? partial.idPrefix;
  const effectivePrefix =
    typeof rawPrefix === 'string' && rawPrefix.trim()
      ? rawPrefix.trim()
      : defaults.idPrefix;

  const parsedDigits = Number(partial.employeeIdSequenceDigits ?? partial.idDigits);
  const effectiveDigits =
    Number.isFinite(parsedDigits) && parsedDigits >= 1 && parsedDigits <= 8
      ? Math.floor(parsedDigits)
      : defaults.idDigits;

  const parsedStartSeq = Number(partial.idStartSeq);
  const parsedCurrentSeq = Number(partial.employeeIdCurrentSequence);
  const parsedLastYear = Number(partial.employeeIdLastYear);

  const rawYearFormat = String(partial.employeeIdYearFormat ?? '').toUpperCase();
  const effectiveYearFormat = rawYearFormat === 'YY' ? 'YY' : 'YYYY';

  const effectiveDelimiter =
    typeof partial.employeeIdDelimiter === 'string'
      ? partial.employeeIdDelimiter
      : defaults.employeeIdDelimiter;

  return {
    idPrefix: effectivePrefix,
    employeeIdPrefix: effectivePrefix,
    idTemplate:
      typeof partial.idTemplate === 'string' && partial.idTemplate.trim()
        ? partial.idTemplate.trim()
        : defaults.idTemplate,
    idDigits: effectiveDigits,
    employeeIdSequenceDigits: effectiveDigits,
    idStartSeq:
      Number.isFinite(parsedStartSeq) && parsedStartSeq >= 1
        ? Math.floor(parsedStartSeq)
        : defaults.idStartSeq,
    idRestartAnnually:
      typeof partial.idRestartAnnually === 'boolean'
        ? partial.idRestartAnnually
        : defaults.idRestartAnnually,
    employeeIdYearFormat: effectiveYearFormat,
    employeeIdDelimiter: effectiveDelimiter,
    employeeIdLastYear: Number.isFinite(parsedLastYear) ? Math.floor(parsedLastYear) : defaults.employeeIdLastYear,
    employeeIdCurrentSequence:
      Number.isFinite(parsedCurrentSeq) && parsedCurrentSeq >= 0
        ? Math.floor(parsedCurrentSeq)
        : defaults.employeeIdCurrentSequence,
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
    idTemplate: _idTemplate,
    idDigits: _idDigits,
    idStartSeq: _idStartSeq,
    idRestartAnnually: _idRestartAnnually,
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
      raw.fields && typeof raw.fields === 'object' && !Array.isArray(raw.fields) && Object.keys(raw.fields).length > 0
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


export const facultyFieldConfigPutBodySchema = teacherFieldConfigPutBodySchema;
export const facultyPreferencesPutBodySchema = teacherPreferencesPutBodySchema;
export type FacultyModulePreferences = TeacherModulePreferences;
export const FACULTY_MODULE_PREFERENCE_KEYS = PREF_KEYS;
export const normalizeFacultyModulePreferences = normalizeTeacherModulePreferences;
export const mergeFacultyFormTabsFromApi = mergeTeachersFormTabsFromApi;
export const composeFacultySettings = composeTeachersSettings;
export const splitFacultySettingsBlob = splitTeachersSettingsBlob;
export const stripFacultyFieldConfigForPersist = stripTeacherFieldConfigForPersist;
export const normalizeFacultySettings = normalizeTeachersSettings;

