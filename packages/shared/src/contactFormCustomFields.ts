/** Helpers for contact form custom (non-seed) fields. */
import { INITIAL_FIELD_SEED } from './contactFieldSeed.js';
import { REMOVED_FORM_FIELD_KEYS } from './contactTabRegistry.js';
import { createFormCustomFieldHelpers } from './createFormCustomFieldHelpers.js';
import type { Contact } from './contactEntityTypes.js';
import type { FieldDefinition } from './contactFieldSchemaTypes.js';

const helpers = createFormCustomFieldHelpers(INITIAL_FIELD_SEED);
const removedKeySet = new Set(REMOVED_FORM_FIELD_KEYS);

/** Keys owned by static form chrome / list-tab structure (INITIAL_FIELD_SEED). */
export function listContactSystemFormFieldKeys(): ReadonlySet<string> {
  const keys = new Set(helpers.listSystemFormFieldKeys());
  for (const key of REMOVED_FORM_FIELD_KEYS) {
    keys.add(key);
  }
  return keys;
}

/**
 * Enabled non-seed fields for the contact form.
 * When `tabId` is set, only fields stored under that config tab are returned
 * (so a field created on Basic stays on Basic).
 * When omitted, returns enabled non-seed fields from every tab (legacy aggregate).
 */
export function listEnabledCustomContactFormFields(
  fields: Record<string, FieldDefinition[]>,
  tabId?: string,
): FieldDefinition[] {
  return helpers
    .listEnabledCustomFormFields(fields, tabId)
    .filter((field) => !removedKeySet.has(field.key));
}

/** True when `fieldId` is part of the static form seed for `tabId`. */
export const isContactSystemFormField = helpers.isSystemFormField;

/**
 * Seeds Setup `defaultValue` for enabled scalar custom fields on new contacts only.
 * Does not overwrite keys already present on the draft (including `initialDraft`).
 */
export function applyContactScalarCustomFieldDefaults(
  draft: Partial<Contact>,
  fields: Record<string, FieldDefinition[]> | undefined,
): Partial<Contact> {
  if (!fields) return draft;
  if (draft.id != null && String(draft.id).length > 0) return draft;

  const next: Record<string, unknown> = { ...draft };
  const customFields = [
    ...listEnabledCustomContactFormFields(fields, "basic"),
    ...listEnabledCustomContactFormFields(fields, "custom"),
  ];
  for (const field of customFields) {
    if (Object.prototype.hasOwnProperty.call(next, field.key)) continue;
    if (field.defaultValue === undefined || field.defaultValue === null) continue;
    next[field.key] = field.defaultValue;
  }
  return next as Partial<Contact>;
}
