/**
 * @file facultyFormCustomFields.ts
 * @description Helpers for Faculty form custom (non-seed) fields and field lookups.
 */
import { INITIAL_FACULTY_FIELD_SEED } from './moduleFieldSetupPersons.js';
import type { FieldDefinition } from './contactFieldSchemaTypes.js';
import { getFlatFieldsConfig } from './moduleFieldConfigUtils.js';
import { createFormCustomFieldHelpers } from './createFormCustomFieldHelpers.js';

const helpers = createFormCustomFieldHelpers(INITIAL_FACULTY_FIELD_SEED);

/**
 * Returns keys owned by static faculty form chrome ({@link INITIAL_FACULTY_FIELD_SEED}).
 */
export function listFacultySystemFormFieldKeys(): ReadonlySet<string> {
  return helpers.listSystemFormFieldKeys();
}

/**
 * Deep-clone {@link INITIAL_FACULTY_FIELD_SEED} for defaults and Setup overlays.
 */
export function cloneFacultyFieldSeed(): Record<string, FieldDefinition[]> {
  const next: Record<string, FieldDefinition[]> = {};
  for (const [tabId, fields] of Object.entries(INITIAL_FACULTY_FIELD_SEED)) {
    next[tabId] = fields.map((field) => ({ ...field }));
  }
  return next;
}

const RETIRED_FACULTY_FORM_FIELDS = new Set([
  'specialization',
  'qualification',
  'hierarchyRank',
  'reportingFacultyId',
]);

function fieldKeyRequired(
  tabbed: Record<string, FieldDefinition[]>,
  key: string,
): boolean {
  return Object.values(tabbed).some((tabFields) =>
    tabFields.some((field) => field.key === key && field.required),
  );
}

/** Product invariants after Setup overlays (contact compulsory; retired fields off; alias required parity). */
function applyFacultyFieldProductLocks(
  tabbed: Record<string, FieldDefinition[]>,
): Record<string, FieldDefinition[]> {
  for (const tabFields of Object.values(tabbed)) {
    for (let index = 0; index < tabFields.length; index += 1) {
      const field = tabFields[index];
      if (field.key === 'contactId') {
        tabFields[index] = { ...field, enabled: true, required: true };
      } else if (RETIRED_FACULTY_FORM_FIELDS.has(field.key)) {
        tabFields[index] = { ...field, enabled: false, required: false };
      }
    }
  }
  const syncRequired = (primary: string, alias: string) => {
    if (!fieldKeyRequired(tabbed, primary) && !fieldKeyRequired(tabbed, alias)) return;
    for (const tabFields of Object.values(tabbed)) {
      for (let index = 0; index < tabFields.length; index += 1) {
        const field = tabFields[index];
        if (field.key === primary) tabFields[index] = { ...field, required: true };
        if (field.key === alias) tabFields[index] = { ...field, required: false };
      }
    }
  };
  syncRequired('designation', 'designationId');
  syncRequired('department', 'departmentId');
  return tabbed;
}

/**
 * Normalize Faculty `settings.fields` to a tabbed Setup Fields map for column sync.
 * Flat legacy `{ fieldId: { enabled } }` overlays onto {@link INITIAL_FACULTY_FIELD_SEED}.
 */
export function resolveFacultyFieldsMapForColumnSync(
  fields: Record<string, unknown> | undefined,
): Readonly<Record<string, FieldDefinition[]>> {
  if (!fields || typeof fields !== 'object') {
    return applyFacultyFieldProductLocks(cloneFacultyFieldSeed());
  }
  const entries = Object.entries(fields);
  if (entries.length > 0 && entries.every(([, value]) => Array.isArray(value))) {
    const cloned: Record<string, FieldDefinition[]> = {};
    for (const [tabId, tabFields] of entries) {
      cloned[tabId] = (tabFields as FieldDefinition[]).map((field) => ({ ...field }));
    }
    return applyFacultyFieldProductLocks(cloned);
  }

  const flat = getFlatFieldsConfig(fields);
  const tabbed = cloneFacultyFieldSeed();
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
  return applyFacultyFieldProductLocks(tabbed);
}

/**
 * Returns enabled non-seed fields for the Faculty form.
 * When `tabId` is set, only fields stored under that config tab are returned.
 * When omitted, returns enabled non-seed fields from every tab.
 */
export function listEnabledCustomFacultyFormFields<T extends FieldDefinition>(
  fields: Record<string, ReadonlyArray<T>>,
  tabId?: string,
): ReadonlyArray<T> {
  return helpers.listEnabledCustomFormFields(fields, tabId);
}

/**
 * Returns true when `fieldId` is part of the static form seed for `tabId`.
 */
export function isFacultySystemFormField(tabId: string, fieldId: string): boolean {
  return helpers.isSystemFormField(tabId, fieldId);
}

/**
 * Find a field definition by key across a tabbed Faculty fields map.
 */
export function findFacultyFieldInMap(
  fields: Record<string, FieldDefinition[]>,
  fieldKey: string,
): FieldDefinition | undefined {
  return findFacultyFieldLocation(fields, fieldKey)?.field;
}

/**
 * Find tab id + field definition by key across a tabbed Faculty fields map.
 */
export function findFacultyFieldLocation(
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
 * Find a field definition under a specific Faculty Setup tab.
 */
export function findFacultyTabField(
  fields: Record<string, FieldDefinition[]>,
  tabId: string,
  fieldKey: string,
): FieldDefinition | undefined {
  return (fields[tabId] ?? []).find((field) => field.key === fieldKey);
}
