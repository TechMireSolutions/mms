/**
 * @file contactFieldsStore.ts
 * @description Contacts field configuration via `/api/contacts/field-config`.
 * Thin adapter over the shared `createModuleSetupConfigApi` factory; the
 * migrate + sanitize + merge-with-defaults pipeline stays contacts-local.
 */
import {
  CONFIG_VERSION,
  CONTACTS_MODULE_MANIFEST,
  type FieldConfig,
  type FieldDefinition,
} from "@mms/shared";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";
import { getContactFieldSystemDefaults, migrateContactFieldConfig } from "./contactFieldsMigration";
import { sanitizeContactFieldConfig } from "./contactFieldsSanitize";

function mergeWithDefaults(parsed: FieldConfig): FieldConfig {
  const fallback = getContactFieldSystemDefaults();
  const migrated = migrateContactFieldConfig(parsed);

  const mergedFields: Record<string, FieldDefinition[]> = { ...fallback.fields };
  if (migrated.fields && typeof migrated.fields === "object" && !Array.isArray(migrated.fields)) {
    for (const [tabKey, fieldsList] of Object.entries(migrated.fields)) {
      if (Array.isArray(fieldsList) && fieldsList.length > 0) {
        mergedFields[tabKey] = fieldsList;
      }
    }
  }

  const merged: FieldConfig = {
    ...fallback,
    ...migrated,
    enabledTabs: migrated.enabledTabs ?? fallback.enabledTabs,
    requiredTabs: migrated.requiredTabs ?? fallback.requiredTabs,
    fields: mergedFields,
  };
  return sanitizeContactFieldConfig(merged);
}

/** Strip formTabs on store save — fieldConfig manages field registry and preferences. */
function fieldConfigWithoutFormTabs(config: FieldConfig): Omit<FieldConfig, "formTabs"> & {
  version: number;
} {
  const { formTabs: _formTabs, ...rest } = config;
  return { ...rest, version: CONFIG_VERSION };
}

const normalizeFieldConfig = (config: unknown): FieldConfig =>
  mergeWithDefaults((config as FieldConfig | null) ?? getContactFieldSystemDefaults());

/** Default compose: normalized field config (preferences are stored separately). */
function composeSettings(
  fieldConfig: unknown,
  _preferences: unknown,
  formTabs?: unknown[],
): FieldConfig {
  const config = normalizeFieldConfig(fieldConfig);
  if (formTabs) config.formTabs = formTabs as FieldConfig["formTabs"];
  return config;
}

const api = createModuleSetupConfigApi<FieldConfig, unknown>({
  restBasePath: CONTACTS_MODULE_MANIFEST.restBasePath,
  normalizeFieldConfig,
  composeSettings,
  normalizePrefs: (prefs: unknown) => prefs,
  stripFieldConfig: fieldConfigWithoutFormTabs as (config: FieldConfig) => Record<string, unknown>,
});

/**
 * Sync read — last hydrated server config or system defaults.
 * Prefer Query (`useContactFieldConfigQuery`) for authenticated loads.
 */
export const loadFieldConfig = api.getSettingsMemoryFallback;

export const setFieldConfigMemory = api.setFieldConfigMemory;

export const fetchFieldConfig = api.fetchFieldConfig;

/** Optimistic local write — does not hit the server. Prefer saveFieldConfigAsync. */
export const saveFieldConfig = api.setFieldConfigMemory;

/** Persists contact field config via REST and updates memory. */
export const saveFieldConfigAsync = api.saveFieldConfigAsync;
