import type { ColumnRegistryEntry, FieldDefinition } from './contactTypes.js';
import {
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  STUDENT_COLUMN_FIELD_MAPPING,
} from './moduleFieldSetupPersons.js';
import { listEnabledCustomStudentFormFields } from './studentFormCustomFields.js';

const STUDENT_LOCKED_ENABLED_TABS = new Set(['basic']);

function withStudentLockedEnabledTabs(enabledTabIds: Iterable<string>): Set<string> {
  const enabled = new Set(
    [...enabledTabIds].map((tabId) => tabId.toLowerCase()).filter(Boolean),
  );
  for (const locked of STUDENT_LOCKED_ENABLED_TABS) {
    enabled.add(locked);
  }
  return enabled;
}

function customColumnKey(fieldKey: string): string {
  return `custom:${fieldKey}`;
}

/**
 * Aligns Students `columnRegistry.enabled` with Setup Fields tab/field enablement.
 * Mapped system columns for disabled tabs/fields are forced off; when active again they
 * restore the default registry enabled flag. Custom columns (`custom:{key}`) stay when
 * the field is enabled and drop when disabled.
 */
export function syncStudentColumnRegistryWithFields(
  columnRegistry: ColumnRegistryEntry[] | undefined,
  fields: Record<string, FieldDefinition[]>,
  enabledTabIds: Iterable<string>,
): ColumnRegistryEntry[] {
  const enabledTabs = withStudentLockedEnabledTabs(enabledTabIds);

  const byKey = new Map<string, ColumnRegistryEntry>();
  for (const col of DEFAULT_STUDENT_COLUMN_REGISTRY) {
    byKey.set(col.key, { ...col });
  }
  for (const col of columnRegistry || []) {
    // Drop legacy Work keys that no longer exist in the default registry.
    if (
      !col.key.startsWith('custom:')
      && !DEFAULT_STUDENT_COLUMN_REGISTRY.some((entry) => entry.key === col.key)
    ) {
      continue;
    }
    const existing = byKey.get(col.key);
    byKey.set(col.key, existing ? { ...existing, ...col } : { ...col });
  }

  // Ensure custom columns exist for enabled non-seed fields.
  const customFields = listEnabledCustomStudentFormFields(fields);
  for (const field of customFields) {
    const key = customColumnKey(field.key);
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        label: field.label,
        labelKey: field.labelKey,
        enabled: true,
        order: 100 + (field.order ?? 0),
        sortable: false,
      });
    } else {
      const existing = byKey.get(key)!;
      byKey.set(key, {
        ...existing,
        label: field.label || existing.label,
        labelKey: field.labelKey ?? existing.labelKey,
        enabled: existing.enabled !== false,
      });
    }
  }

  // Remove custom columns whose fields are no longer enabled/present.
  const enabledCustomKeys = new Set(customFields.map((field) => customColumnKey(field.key)));
  for (const key of [...byKey.keys()]) {
    if (key.startsWith('custom:') && !enabledCustomKeys.has(key)) {
      byKey.delete(key);
    }
  }

  return Array.from(byKey.values())
    .map((col) => {
      const mapping = STUDENT_COLUMN_FIELD_MAPPING[col.key];
      if (!mapping) return col;

      const tabOk =
        mapping.tabId === 'basic' || enabledTabs.has(mapping.tabId.toLowerCase());
      const field = (fields[mapping.tabId] || []).find(
        (candidate) => candidate.key === mapping.fieldId,
      );
      const fieldOk = field ? field.enabled !== false : true;
      if (!tabOk || !fieldOk) {
        return { ...col, enabled: false };
      }

      const defaultCol = DEFAULT_STUDENT_COLUMN_REGISTRY.find((entry) => entry.key === col.key);
      if (defaultCol) {
        return { ...col, enabled: defaultCol.enabled };
      }
      return col;
    })
    .sort((a, b) => a.order - b.order);
}
