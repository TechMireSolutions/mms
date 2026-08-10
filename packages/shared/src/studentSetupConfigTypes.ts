import { z } from 'zod';
import type { FieldDefinition, TabDefinition } from './contactTypes.js';
import {
  DEFAULT_STUDENTS_SETTINGS,
  type StudentsSettings,
} from './studentsModuleSettings.js';
import { STUDENT_TAB_REGISTRY, STUDENT_LOCKED_ENABLED_TABS } from './moduleFieldSetupPersons.js';
import { normalizeStudentsSettings } from './studentSettingsUtils.js';
import { moduleFieldConfigPutBodySchema } from './moduleFieldConfigPutBodySchema.js';

/** PUT /api/students/field-config — field registry JSON without formTabs SSOT. */
export const studentFieldConfigPutBodySchema = moduleFieldConfigPutBodySchema
  .extend({
    columnRegistry: z.array(z.record(z.string(), z.unknown())).optional(),
    customFields: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();

/** PUT /api/students/preferences — GR / auto-id prefs only. */
export const studentPreferencesPutBodySchema = z
  .object({
    autoGenerateId: z.boolean().optional(),
    grNumberTemplate: z.string().optional(),
    grNumberDigits: z.number().optional(),
    grNumberRestartAnnually: z.boolean().optional(),
  })
  .passthrough();

export type StudentModulePreferences = Pick<
  StudentsSettings,
  'autoGenerateId' | 'grNumberTemplate' | 'grNumberDigits' | 'grNumberRestartAnnually'
>;

const PREF_KEYS = [
  'autoGenerateId',
  'grNumberTemplate',
  'grNumberDigits',
  'grNumberRestartAnnually',
] as const;

/** Normalize GR / auto-id preferences (typed `student_module_preferences`). */
export function normalizeStudentModulePreferences(
  partial?: Partial<StudentModulePreferences> | Record<string, unknown> | null,
): StudentModulePreferences {
  const defaults: StudentModulePreferences = {
    autoGenerateId: DEFAULT_STUDENTS_SETTINGS.autoGenerateId,
    grNumberTemplate: DEFAULT_STUDENTS_SETTINGS.grNumberTemplate,
    grNumberDigits: DEFAULT_STUDENTS_SETTINGS.grNumberDigits,
    grNumberRestartAnnually: DEFAULT_STUDENTS_SETTINGS.grNumberRestartAnnually,
  };
  if (!partial || typeof partial !== 'object') return { ...defaults };

  return {
    autoGenerateId:
      typeof partial.autoGenerateId === 'boolean'
        ? partial.autoGenerateId
        : defaults.autoGenerateId,
    grNumberTemplate:
      typeof partial.grNumberTemplate === 'string' && partial.grNumberTemplate.trim()
        ? partial.grNumberTemplate
        : defaults.grNumberTemplate,
    grNumberDigits:
      typeof partial.grNumberDigits === 'number' && Number.isFinite(partial.grNumberDigits)
        ? Math.max(1, Math.floor(partial.grNumberDigits))
        : defaults.grNumberDigits,
    grNumberRestartAnnually:
      typeof partial.grNumberRestartAnnually === 'boolean'
        ? partial.grNumberRestartAnnually
        : defaults.grNumberRestartAnnually,
  };
}

/** Field-config slice persisted on `student_field_configs` (never formTabs / GR prefs). */
export function stripStudentFieldConfigForPersist(
  config: StudentsSettings | Record<string, unknown>,
): Record<string, unknown> {
  const {
    formTabs: _formTabs,
    autoGenerateId: _autoGenerateId,
    grNumberTemplate: _grNumberTemplate,
    grNumberDigits: _grNumberDigits,
    grNumberRestartAnnually: _grNumberRestartAnnually,
    ...rest
  } = config as StudentsSettings & Record<string, unknown>;
  return rest;
}

/** Split a legacy `students_settings` blob into typed field-config + preferences rows. */
export function splitStudentsSettingsBlob(raw: unknown): {
  fieldConfig: Record<string, unknown>;
  preferences: StudentModulePreferences;
} {
  const settings = normalizeStudentsSettings(raw);
  return {
    fieldConfig: stripStudentFieldConfigForPersist(settings),
    preferences: normalizeStudentModulePreferences(settings),
  };
}

/** Compose FE/validation StudentsSettings from typed parts (+ optional custom tabs). */
export function composeStudentsSettings(
  fieldConfig: unknown,
  preferences: unknown,
  formTabs?: TabDefinition[],
): StudentsSettings {
  const prefs = normalizeStudentModulePreferences(
    preferences as Partial<StudentModulePreferences> | null,
  );
  const merged = normalizeStudentsSettings({
    ...(fieldConfig && typeof fieldConfig === 'object' && !Array.isArray(fieldConfig)
      ? (fieldConfig as Record<string, unknown>)
      : {}),
    ...prefs,
    ...(formTabs ? { formTabs } : {}),
  });
  return merged;
}

/**
 * Merge API custom_tabs with document/default form tabs for Students Setup/forms.
 * Empty API → document tabs when present, else {@link STUDENT_TAB_REGISTRY}.
 */
export function mergeStudentsFormTabsFromApi(
  documentFormTabs: TabDefinition[] | undefined,
  apiTabs: TabDefinition[],
  _fields?: Record<string, FieldDefinition[]> | undefined,
): TabDefinition[] {
  const documentOrDefault =
    documentFormTabs && documentFormTabs.length > 0
      ? documentFormTabs
      : [...STUDENT_TAB_REGISTRY];

  const merged =
    apiTabs.length === 0
      ? documentOrDefault
      : [
          ...apiTabs,
          ...STUDENT_TAB_REGISTRY.filter(
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

/** Default enabled tab ids from the Students tab registry seed. */
export function defaultStudentEnabledTabIds(): string[] {
  return STUDENT_TAB_REGISTRY.filter((tab) => tab.enabled !== false).map((tab) => tab.key);
}

export type StudentEnabledTabsInput = {
  enabledTabs?: readonly string[] | null;
  formTabs?: readonly TabDefinition[] | null;
};

function withStudentLockedEnabledTabs(tabIds: Iterable<string>): string[] {
  const set = new Set([...tabIds].map((tabId) => tabId.trim()).filter(Boolean));
  for (const locked of STUDENT_LOCKED_ENABLED_TABS) {
    set.add(locked);
  }
  return [...set];
}

/**
 * Resolves Students form / Setup / detail / export enabled tab ids.
 * When `formTabs` is non-empty, each tab's `enabled` flag is authoritative (Contacts-shaped).
 * Otherwise falls back to non-empty `enabledTabs`, then registry defaults.
 * Locked tabs ({@link STUDENT_LOCKED_ENABLED_TABS}) are always included.
 */
export function resolveStudentEnabledTabIds(
  settings?: StudentEnabledTabsInput | null,
): string[] {
  const formTabs = settings?.formTabs;
  if (formTabs && formTabs.length > 0) {
    const fromFormTabs = formTabs
      .filter((tab) => tab.enabled !== false)
      .map((tab) => tab.key);
    return withStudentLockedEnabledTabs(fromFormTabs);
  }

  const enabledTabs = settings?.enabledTabs;
  const source =
    enabledTabs && enabledTabs.length > 0
      ? enabledTabs.filter((tabId) => Boolean(tabId?.trim()))
      : defaultStudentEnabledTabIds();
  return withStudentLockedEnabledTabs(source);
}

export { PREF_KEYS as STUDENT_MODULE_PREFERENCE_KEYS };
