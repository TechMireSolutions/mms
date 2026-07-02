/**
 * @file contactFieldsStore.ts
 * @description Tenant-cache persistence for contact field configuration.
 *
 * The tenant database is the source of truth; the browser cache keeps the
 * active session responsive. The store exposes these operations:
 *
 *  loadFieldConfig()       — load the active (per-session) config
 *  saveFieldConfig(config) — persist the active config
 *
 * Migration: when a stored config is detected with an older (or missing)
 * CONFIG_VERSION, migrateConfig() fills in any keys that were added in newer
 * versions before the caller receives the object.
 */
import {
  CONFIG_VERSION,
  DEFAULT_ENABLED_TABS,
  DEFAULT_REQUIRED_TABS,
  FieldConfig,
  FieldDefinition,
  INITIAL_FIELD_SEED,
  DEFAULT_PAGE_TABS,
  DEFAULT_FORM_TABS,
  DEFAULT_DETAIL_TABS,
  DEFAULT_SETTINGS_SUB_TABS,
  DEFAULT_COLUMN_REGISTRY,
  REMOVED_FORM_FIELD_KEYS,
  refreshModuleTierTabLabels,
  refreshModuleTierTabKeys,
} from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a deep clone of the shared system schema defaults.
 * Always returns a fresh object so callers can mutate freely.
 *
 * @returns {FieldConfig} The default field configuration.
 */
function getSystemDefaults(): FieldConfig {
  const fieldsClone = JSON.parse(JSON.stringify(INITIAL_FIELD_SEED));

  return {
    version: CONFIG_VERSION,
    enabledTabs: [...DEFAULT_ENABLED_TABS],
    requiredTabs: [...DEFAULT_REQUIRED_TABS],
    fields: fieldsClone,
    pageTabs: [...DEFAULT_PAGE_TABS],
    formTabs: [...DEFAULT_FORM_TABS],
    detailTabs: [...DEFAULT_DETAIL_TABS],
    settingsSubTabs: [...DEFAULT_SETTINGS_SUB_TABS],
    columnRegistry: [...DEFAULT_COLUMN_REGISTRY],
  };
}

/**
 * Migrates a stored config object from an older schema version to the current
 * one. Operates on a plain copy — never mutates the original.
 *
 * @param {unknown} config - The raw config object loaded from storage.
 * @returns {FieldConfig} A migrated config object at CONFIG_VERSION.
 */
function migrateConfig(config: unknown): FieldConfig {
  if (!config || typeof config !== "object") {
    return getSystemDefaults();
  }

  const rawConfig = config as Record<string, unknown>;
  const storedVersion = typeof rawConfig.version === "number" ? rawConfig.version : 0;

  // Since we migrated the schema significantly, if version is < 2, just return defaults.
  if (storedVersion < 2) {
    return getSystemDefaults();
  }

  const workingConfig = { ...rawConfig } as unknown as Partial<FieldConfig>;
  
  // Populate dynamic tab fields if they are missing
  const defaults = getSystemDefaults();
  
  const normalizeTabs = (tabs: any[] | undefined) => {
    if (!Array.isArray(tabs)) return undefined;
    return tabs.map((tab) => {
      if (tab && typeof tab === "object" && !tab.key && tab.id) {
        return { ...tab, key: tab.id };
      }
      return tab;
    });
  };

  const normalizedPageTabs = refreshModuleTierTabLabels(
    refreshModuleTierTabKeys(normalizeTabs(workingConfig.pageTabs) ?? defaults.pageTabs ?? DEFAULT_PAGE_TABS),
  );
  workingConfig.pageTabs = normalizedPageTabs;
  workingConfig.formTabs = normalizeTabs(workingConfig.formTabs) ?? defaults.formTabs;
  workingConfig.detailTabs = normalizeTabs(workingConfig.detailTabs) ?? defaults.detailTabs;
  workingConfig.settingsSubTabs = normalizeTabs(workingConfig.settingsSubTabs) ?? defaults.settingsSubTabs;
  workingConfig.columnRegistry = workingConfig.columnRegistry ?? defaults.columnRegistry;
  workingConfig.fields = workingConfig.fields ?? defaults.fields;
  delete (workingConfig as Record<string, unknown>).uiStrings;

  return workingConfig as FieldConfig;
}

/**
 * Sanitizes a loaded configuration against the current schema definitions.
 * Pure function — returns a new object and never mutates the argument.
 *
 * - Strips unknown field IDs from `enabled`/`required` arrays (top-level).
 * - Strips unknown field IDs from each tab's `enabled`/`required` arrays.
 * - Unknown tabs inside `tabFieldConfig` are removed.
 *
 * @param {FieldConfig} config - Configuration object to sanitize.
 * @returns {FieldConfig} A sanitized copy of the configuration.
 */
export function sanitizeConfig(config: FieldConfig): FieldConfig {
  if (!config || typeof config !== "object") {
    return getSystemDefaults();
  }

  const sanitizedConfig = { ...config };
  delete (sanitizedConfig as Record<string, unknown>).uiStrings;

  // Strip fields retired from the form registry from any persisted config.
  if (REMOVED_FORM_FIELD_KEYS.length > 0 && sanitizedConfig.fields && typeof sanitizedConfig.fields === "object") {
    const removed = new Set(REMOVED_FORM_FIELD_KEYS);
    const cleanedFields: Record<string, FieldDefinition[]> = {};
    for (const [tabKey, tabFields] of Object.entries(sanitizedConfig.fields)) {
      cleanedFields[tabKey] = Array.isArray(tabFields)
        ? tabFields.filter((field) => !removed.has(field.key))
        : tabFields;
    }
    sanitizedConfig.fields = cleanedFields;
  }

  if (Array.isArray(sanitizedConfig.formTabs)) {
    sanitizedConfig.formTabs = sanitizedConfig.formTabs.filter((tab) => tab && typeof tab === "object" && typeof tab.key === "string" && tab.key.trim().length > 0);
  }

  const validPageTabIds = new Set(DEFAULT_PAGE_TABS.map((tab) => tab.key));
  if (Array.isArray(sanitizedConfig.pageTabs)) {
    sanitizedConfig.pageTabs = sanitizedConfig.pageTabs.filter((tab) => validPageTabIds.has(tab.key));
  }

  if (Array.isArray(sanitizedConfig.detailTabs)) {
    sanitizedConfig.detailTabs = sanitizedConfig.detailTabs.filter((tab) => tab && typeof tab === "object" && typeof tab.key === "string" && tab.key.trim().length > 0);
  }

  const validSettingsSubTabIds = new Set(DEFAULT_SETTINGS_SUB_TABS.map((tab) => tab.key));
  if (Array.isArray(sanitizedConfig.settingsSubTabs)) {
    sanitizedConfig.settingsSubTabs = sanitizedConfig.settingsSubTabs.filter((tab) => validSettingsSubTabIds.has(tab.key));
  }

  return sanitizedConfig;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Loads the active field config.
 * Merges missing structural keys from shared schema defaults so partial saves are safe.
 *
 * @returns {FieldConfig} The active field configuration.
 */
export function loadFieldConfig(): FieldConfig {
  const fallback = getSystemDefaults();
  const parsed = getObject("contact_field_config", fallback);
  const migrated = migrateConfig(parsed);

  const merged: FieldConfig = {
    ...fallback,
    ...migrated,
    enabledTabs: migrated.enabledTabs ?? fallback.enabledTabs,
    requiredTabs: migrated.requiredTabs ?? fallback.requiredTabs,
    fields: migrated.fields ?? fallback.fields,
  };
  return sanitizeConfig(merged);
}

/**
 * Persists the active field config.
 * Always stamps the current CONFIG_VERSION before saving.
 * Server sync via `saveObject` is audited when persisted through `/api/db` (`contact_field_config`).
 *
 * @param {FieldConfig} config - Configuration object to save.
 */
export function saveFieldConfig(config: FieldConfig): void {
  saveObject("contact_field_config", { ...config, version: CONFIG_VERSION });
}
