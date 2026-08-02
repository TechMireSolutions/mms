/** Helpers for contact form custom (non-seed) fields. */
import { INITIAL_FIELD_SEED } from './contactFieldSeed.js';
import { REMOVED_FORM_FIELD_KEYS } from './contactTabRegistry.js';
import type { FieldDefinition } from './contactFieldSchemaTypes.js';

/** Keys owned by static form chrome / list-tab structure (INITIAL_FIELD_SEED). */
export function listContactSystemFormFieldKeys(): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const tabFields of Object.values(INITIAL_FIELD_SEED)) {
    for (const field of tabFields) {
      keys.add(field.key);
    }
  }
  for (const key of REMOVED_FORM_FIELD_KEYS) {
    keys.add(key);
  }
  return keys;
}

/**
 * Enabled non-seed fields that the create/edit form must render (Custom Fields tab).
 * Sorted by order within each tab, then tab key for stability.
 */
export function listEnabledCustomContactFormFields(
  fields: Record<string, FieldDefinition[]>,
): FieldDefinition[] {
  const systemKeys = listContactSystemFormFieldKeys();
  const byKey = new Map<string, FieldDefinition>();

  for (const tabFields of Object.values(fields)) {
    for (const field of tabFields) {
      if (!field.enabled || systemKeys.has(field.key)) continue;
      if (!byKey.has(field.key)) {
        byKey.set(field.key, field);
      }
    }
  }

  return [...byKey.values()].sort((left, right) => {
    const orderDelta = (left.order ?? 0) - (right.order ?? 0);
    if (orderDelta !== 0) return orderDelta;
    return left.key.localeCompare(right.key);
  });
}

/** True when `fieldId` is part of the static form seed for `tabId`. */
export function isContactSystemFormField(tabId: string, fieldId: string): boolean {
  return (INITIAL_FIELD_SEED[tabId] ?? []).some((field) => field.key === fieldId);
}
