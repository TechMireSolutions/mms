/** Migrates legacy contacts "emergency" form tab keys to "relationship". */
import type { ColumnRegistryEntry, FieldConfig, FieldDefinition, TabDefinition } from './contactFieldSchemaTypes.js';

const LEGACY_TAB = 'emergency';
const TAB = 'relationship';

const COLUMN_KEY_MAP: Record<string, string> = {
  emergency_contact: 'relationship_contact',
  emergency_relationship: 'relationship_type',
};

function remapTabKey(key: string | undefined): string | undefined {
  return key === LEGACY_TAB ? TAB : key;
}

function migrateTabs(tabs: TabDefinition[] | undefined): TabDefinition[] | undefined {
  if (!Array.isArray(tabs)) return tabs;
  return tabs.map((tab) => {
    if (!tab || typeof tab !== 'object') return tab;
    const nextKey = remapTabKey(tab.key);
    if (nextKey === tab.key) return tab;
    const legacyLabelKey = tab.labelKey as string | undefined;
    return {
      ...tab,
      key: nextKey ?? tab.key,
      label: tab.label === 'Emergency' ? 'Relationship' : tab.label,
      labelKey:
        legacyLabelKey === 'contacts.form.tabEmergency' || legacyLabelKey === 'contacts.tabs.emergency'
          ? 'contacts.form.tabRelationship'
          : tab.labelKey,
    };
  });
}

function migrateFields(
  fields: Record<string, FieldDefinition[]> | undefined,
): Record<string, FieldDefinition[]> | undefined {
  if (!fields || typeof fields !== 'object') return fields;
  if (!fields[LEGACY_TAB]) return fields;
  const next = { ...fields };
  if (!next[TAB]) {
    next[TAB] = next[LEGACY_TAB];
  }
  delete next[LEGACY_TAB];
  return next;
}

function migrateStringList(list: string[] | undefined): string[] | undefined {
  if (!Array.isArray(list)) return list;
  return list.map((entry) => (entry === LEGACY_TAB ? TAB : entry));
}

function migrateColumnRegistry(
  columns: ColumnRegistryEntry[] | undefined,
): ColumnRegistryEntry[] | undefined {
  if (!Array.isArray(columns)) return columns;
  return columns.map((column) => {
    if (!column || typeof column !== 'object') return column;
    const nextKey = COLUMN_KEY_MAP[column.key];
    if (!nextKey) return column;
    return {
      ...column,
      key: nextKey,
      label:
        column.key === 'emergency_contact'
          ? 'Relationship Contact'
          : column.key === 'emergency_relationship'
            ? 'Relationship Type'
            : column.label,
      labelKey:
        column.key === 'emergency_contact'
          ? 'contacts.columns.relationshipContact'
          : column.key === 'emergency_relationship'
            ? 'contacts.columns.relationshipType'
            : column.labelKey,
    };
  });
}

/**
 * Remaps persisted contact field config from the legacy emergency tab/columns
 * to relationship. Safe to run repeatedly.
 */
export function migrateEmergencyTabToRelationship(config: FieldConfig): FieldConfig {
  return {
    ...config,
    formTabs: migrateTabs(config.formTabs) ?? config.formTabs,
    enabledTabs: migrateStringList(config.enabledTabs) ?? config.enabledTabs,
    requiredTabs: migrateStringList(config.requiredTabs) ?? config.requiredTabs,
    fields: migrateFields(config.fields) ?? config.fields,
    columnRegistry: migrateColumnRegistry(config.columnRegistry) ?? config.columnRegistry,
  };
}
