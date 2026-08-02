import type { ColumnRegistryEntry, FieldDefinition } from './contactFieldSchemaTypes.js';
import {
  COLUMN_FIELD_MAPPING,
  DEFAULT_COLUMN_REGISTRY,
} from './contactTabRegistry.js';
import { withContactLockedEnabledTabs } from './contactEnabledTabs.js';

/**
 * Aligns `columnRegistry.enabled` with Setup Fields tab/field enablement.
 * Mapped columns for disabled tabs/fields are forced off; when active again they
 * restore the default registry enabled flag (custom columns keep stored enabled).
 */
export function syncContactColumnRegistryWithFields(
  columnRegistry: ColumnRegistryEntry[] | undefined,
  fields: Record<string, FieldDefinition[]>,
  enabledTabIds: Iterable<string>,
): ColumnRegistryEntry[] {
  const enabledTabs = new Set(withContactLockedEnabledTabs(enabledTabIds));

  const byKey = new Map<string, ColumnRegistryEntry>();
  for (const col of DEFAULT_COLUMN_REGISTRY) {
    byKey.set(col.key, { ...col });
  }
  for (const col of columnRegistry || []) {
    const existing = byKey.get(col.key);
    byKey.set(col.key, existing ? { ...existing, ...col } : { ...col });
  }

  return Array.from(byKey.values())
    .map((col) => {
      const mapping = COLUMN_FIELD_MAPPING[col.key];
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

      const defaultCol = DEFAULT_COLUMN_REGISTRY.find((entry) => entry.key === col.key);
      if (defaultCol) {
        return { ...col, enabled: defaultCol.enabled };
      }
      return col;
    })
    .sort((a, b) => a.order - b.order);
}
