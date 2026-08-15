/**
 * @file teacherFormCustomFields.ts
 * @description Helpers for Teachers form custom (non-seed) fields and field lookups.
 */
import { INITIAL_TEACHERS_FIELD_SEED } from './moduleFieldSetupPersons.js';
import type { FieldDefinition } from './contactFieldSchemaTypes.js';
import { getFlatFieldsConfig } from './moduleFieldConfigUtils.js';
import { createFormCustomFieldHelpers } from './createFormCustomFieldHelpers.js';

const helpers = createFormCustomFieldHelpers(INITIAL_TEACHERS_FIELD_SEED);

/**
 * Returns keys owned by static teacher form chrome ({@link INITIAL_TEACHERS_FIELD_SEED}).
 */
export function listTeacherSystemFormFieldKeys(): ReadonlySet<string> {
  return helpers.listSystemFormFieldKeys();
}

/**
 * Deep-clone {@link INITIAL_TEACHERS_FIELD_SEED} for defaults and Setup overlays.
 */
export function cloneTeacherFieldSeed(): Record<string, FieldDefinition[]> {
  const next: Record<string, FieldDefinition[]> = {};
  for (const [tabId, fields] of Object.entries(INITIAL_TEACHERS_FIELD_SEED)) {
    next[tabId] = fields.map((field) => ({ ...field }));
  }
  return next;
}

/**
 * Normalize Teachers `settings.fields` to a tabbed Setup Fields map for column sync.
 * Flat legacy `{ fieldId: { enabled } }` overlays onto {@link INITIAL_TEACHERS_FIELD_SEED}.
 */
export function resolveTeacherFieldsMapForColumnSync(
  fields: Record<string, unknown> | undefined,
): Record<string, FieldDefinition[]> {
  if (!fields || typeof fields !== 'object') {
    return cloneTeacherFieldSeed();
  }
  const entries = Object.entries(fields);
  if (entries.length > 0 && entries.every(([, value]) => Array.isArray(value))) {
    return fields as Record<string, FieldDefinition[]>;
  }

  const flat = getFlatFieldsConfig(fields);
  const tabbed = cloneTeacherFieldSeed();
  for (const tabFields of Object.values(tabbed)) {
    for (let index = 0; index < tabFields.length; index += 1) {
      const field = tabFields[index];
      const flags = flat[field.key];
      if (!flags) continue;
      tabFields[index] = {
        ...field,
        enabled: flags.enabled,
        required: flags.required || field.required,
      };
    }
  }
  return tabbed;
}

/**
 * Returns enabled non-seed fields for the Teachers form.
 * When `tabId` is set, only fields stored under that config tab are returned.
 * When omitted, returns enabled non-seed fields from every tab.
 */
export function listEnabledCustomTeacherFormFields<T extends FieldDefinition>(
  fields: Record<string, T[]>,
  tabId?: string,
): T[] {
  return helpers.listEnabledCustomFormFields(fields, tabId);
}

/**
 * Returns true when `fieldId` is part of the static form seed for `tabId`.
 */
export function isTeacherSystemFormField(tabId: string, fieldId: string): boolean {
  return helpers.isSystemFormField(tabId, fieldId);
}

/**
 * Find a field definition by key across a tabbed Teachers fields map.
 */
export function findTeacherFieldInMap(
  fields: Record<string, FieldDefinition[]>,
  fieldKey: string,
): FieldDefinition | undefined {
  return findTeacherFieldLocation(fields, fieldKey)?.field;
}

/**
 * Find tab id + field definition by key across a tabbed Teachers fields map.
 */
export function findTeacherFieldLocation(
  fields: Record<string, FieldDefinition[]>,
  fieldKey: string,
): { tabId: string; field: FieldDefinition } | null {
  for (const [tabId, tabFields] of Object.entries(fields)) {
    const found = tabFields.find((candidate) => candidate.key === fieldKey);
    if (found) return { tabId, field: found };
  }
  return null;
}

/**
 * Find a field definition under a specific Teachers Setup tab.
 */
export function findTeacherTabField(
  fields: Record<string, FieldDefinition[]>,
  tabId: string,
  fieldKey: string,
): FieldDefinition | undefined {
  return (fields[tabId] ?? []).find((field) => field.key === fieldKey);
}

