/**
 * @file contactFieldsStore.ts
 * @description localStorage-backed persistence for contact field configuration.
 *
 * In a production SaaS deployment this would be stored per-madrasa in the
 * database. The store exposes four operations:
 *
 *  loadFieldConfig()       — load the active (per-session) config
 *  saveFieldConfig(cfg)    — persist the active config
 *  loadDefaultConfig()     — load the admin-set default config
 *  saveDefaultConfig(cfg)  — persist the admin-set default config
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
  TAB_REGISTRY,
  DEFAULT_UI_STRINGS,
  INITIAL_FIELD_SEED,
  DEFAULT_PAGE_TABS,
  DEFAULT_FORM_TABS,
  DEFAULT_DETAIL_TABS,
  DEFAULT_SETTINGS_SUB_TABS,
  DEFAULT_COLUMN_REGISTRY,
  REMOVED_FORM_FIELD_KEYS,
  refreshModuleTierTabLabels,
  refreshModuleTierTabKeys,
} from "./contactFields";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a deep clone of the hardcoded system defaults.
 * Always returns a fresh object so callers can mutate freely.
 *
 * @returns {FieldConfig} The default field configuration.
 */
function getHardcodedDefaults(): FieldConfig {
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
    uiStrings: { ...DEFAULT_UI_STRINGS }
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
    return getHardcodedDefaults();
  }

  const rawConfig = config as Record<string, unknown>;
  const storedVersion = typeof rawConfig.version === "number" ? rawConfig.version : 0;

  // Since we migrated the schema significantly, if version is < 2, just return defaults.
  if (storedVersion < 2) {
    return getHardcodedDefaults();
  }

  const cfg = { ...rawConfig } as unknown as Partial<FieldConfig>;
  
  // Populate dynamic tab fields if they are missing
  const defaults = getHardcodedDefaults();
  
  const normalizeTabs = (tabs: any[] | undefined) => {
    if (!Array.isArray(tabs)) return undefined;
    return tabs.map(t => {
      if (t && typeof t === "object" && !t.key && t.id) {
        return { ...t, key: t.id };
      }
      return t;
    });
  };

  const normalizedPageTabs = refreshModuleTierTabLabels(
    refreshModuleTierTabKeys(normalizeTabs(cfg.pageTabs) ?? defaults.pageTabs ?? DEFAULT_PAGE_TABS),
  );
  cfg.pageTabs = normalizedPageTabs;
  cfg.formTabs = normalizeTabs(cfg.formTabs) ?? defaults.formTabs;
  cfg.detailTabs = normalizeTabs(cfg.detailTabs) ?? defaults.detailTabs;
  cfg.settingsSubTabs = normalizeTabs(cfg.settingsSubTabs) ?? defaults.settingsSubTabs;
  cfg.columnRegistry = cfg.columnRegistry ?? defaults.columnRegistry;
  cfg.uiStrings = cfg.uiStrings ?? defaults.uiStrings;
  cfg.fields = cfg.fields ?? defaults.fields;

  return cfg as FieldConfig;
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
    return getHardcodedDefaults();
  }

  const cfg = { ...config };

  // Strip fields retired from the form registry from any persisted config.
  if (REMOVED_FORM_FIELD_KEYS.length > 0 && cfg.fields && typeof cfg.fields === "object") {
    const removed = new Set(REMOVED_FORM_FIELD_KEYS);
    const cleanedFields: Record<string, FieldDefinition[]> = {};
    for (const [tabKey, tabFields] of Object.entries(cfg.fields)) {
      cleanedFields[tabKey] = Array.isArray(tabFields)
        ? tabFields.filter((f) => !removed.has(f.key))
        : tabFields;
    }
    cfg.fields = cleanedFields;
  }

  const validFormTabIds = new Set(TAB_REGISTRY.map((t) => t.key));
  if (Array.isArray(cfg.formTabs)) {
    cfg.formTabs = cfg.formTabs.filter((t) => validFormTabIds.has(t.key));
  }

  const validPageTabIds = new Set(DEFAULT_PAGE_TABS.map((t) => t.key));
  if (Array.isArray(cfg.pageTabs)) {
    cfg.pageTabs = cfg.pageTabs.filter((t) => validPageTabIds.has(t.key));
  }

  const validDetailTabIds = new Set(DEFAULT_DETAIL_TABS.map((t) => t.key));
  if (Array.isArray(cfg.detailTabs)) {
    cfg.detailTabs = cfg.detailTabs.filter((t) => validDetailTabIds.has(t.key));
  }

  const validSettingsSubTabIds = new Set(DEFAULT_SETTINGS_SUB_TABS.map((t) => t.key));
  if (Array.isArray(cfg.settingsSubTabs)) {
    cfg.settingsSubTabs = cfg.settingsSubTabs.filter((t) => validSettingsSubTabIds.has(t.key));
  }

  return cfg;
}



import { getObject, saveObject } from "./db";

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Loads the admin-set default config.
 * Falls back to hardcoded system defaults if nothing is stored.
 *
 * @returns {FieldConfig} The default field configuration.
 */
export function loadDefaultConfig(): FieldConfig {
  const defaults = getHardcodedDefaults();
  const parsed = getObject("contact_field_config_default", defaults);
  return sanitizeConfig(migrateConfig(parsed));
}

/**
 * Persists the admin-set default config.
 *
 * @param {FieldConfig} config - Configuration object to save.
 */
export function saveDefaultConfig(config: FieldConfig): void {
  saveObject("contact_field_config_default", { ...config, version: CONFIG_VERSION });
}

/**
 * Loads the active field config.
 * Merges missing keys from the default config so partial saves are safe.
 * Falls back to loadDefaultConfig() if nothing is stored.
 *
 * @returns {FieldConfig} The active field configuration.
 */
export function loadFieldConfig(): FieldConfig {
  const fallback = loadDefaultConfig();
  const parsed = getObject("contact_field_config", fallback);
  const migrated = migrateConfig(parsed);

  const merged: FieldConfig = {
    ...fallback,
    ...migrated,
    enabledTabs: migrated.enabledTabs ?? fallback.enabledTabs,
    requiredTabs: migrated.requiredTabs ?? fallback.requiredTabs,
    fields: migrated.fields ?? fallback.fields,
    uiStrings: {
      ...fallback.uiStrings,
      ...migrated.uiStrings,
    },
  };
  return sanitizeConfig(merged);
}

/**
 * Persists the active field config.
 * Always stamps the current CONFIG_VERSION before saving.
 *
 * @param {FieldConfig} config - Configuration object to save.
 */
export function saveFieldConfig(config: FieldConfig): void {
  saveObject("contact_field_config", { ...config, version: CONFIG_VERSION });
}

