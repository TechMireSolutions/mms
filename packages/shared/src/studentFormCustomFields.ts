/** Helpers for student form custom (non-seed) fields. */
import { INITIAL_STUDENT_FIELD_SEED } from './moduleFieldSetupPersons.js';
import { createFormCustomFieldHelpers } from './createFormCustomFieldHelpers.js';
import { applyDfsCustomFieldDefaults } from './dynamicFormHelpers.js';
import type { Student } from './studentTypes.js';
import type { FieldDefinition } from './contactFieldSchemaTypes.js';
import type { CustomFieldConfig, TabConfig } from './schemas/dynamicFormSchemas.js';

const helpers = createFormCustomFieldHelpers(INITIAL_STUDENT_FIELD_SEED);

/** Keys owned by static student form chrome (INITIAL_STUDENT_FIELD_SEED). */
export function listStudentSystemFormFieldKeys(): ReadonlySet<string> {
  return helpers.listSystemFormFieldKeys();
}

/**
 * Enabled non-seed fields for the student form.
 * When `tabId` is set, only fields stored under that config tab are returned.
 * When omitted, returns enabled non-seed fields from every tab.
 */
export function listEnabledCustomStudentFormFields<T extends FieldDefinition | CustomFieldConfig>(
  fields: Record<string, T[]>,
  tabId?: string,
): T[] {
  return helpers.listEnabledCustomFormFields(fields, tabId);
}

/** True when `fieldId` is part of the static form seed for `tabId`. */
export function isStudentSystemFormField(tabId: string, fieldId: string): boolean {
  return helpers.isSystemFormField(tabId, fieldId);
}

/**
 * Seeds Setup `defaultValue` for enabled scalar custom fields on new students only.
 * Does not overwrite keys already present on the draft.
 */
export function applyStudentScalarCustomFieldDefaults(
  draft: Partial<Student>,
  fields: Record<string, FieldDefinition[]> | undefined,
): Partial<Student> {
  if (!fields) return draft;
  if (draft.id != null && String(draft.id).length > 0) return draft;

  const next: Record<string, unknown> = { ...draft };
  const customFields = [
    ...listEnabledCustomStudentFormFields(fields, 'basic'),
    ...listEnabledCustomStudentFormFields(fields, 'registration'),
  ];
  for (const field of customFields) {
    if (Object.prototype.hasOwnProperty.call(next, field.key)) continue;
    if (field.defaultValue === undefined || field.defaultValue === null) continue;
    next[field.key] = field.defaultValue;
  }
  return next as Partial<Student>;
}

/**
 * Seeds DFS custom field defaults into student draft customData for new students.
 * Delegates to the shared {@link applyDfsCustomFieldDefaults} helper.
 */
export function applyStudentDfsCustomFieldDefaults(
  draft: Partial<Student>,
  dfsTabs?: TabConfig[],
): Partial<Student> {
  return applyDfsCustomFieldDefaults(
    draft as { id?: unknown; customData?: Record<string, unknown> | null },
    dfsTabs,
  ) as Partial<Student>;
}