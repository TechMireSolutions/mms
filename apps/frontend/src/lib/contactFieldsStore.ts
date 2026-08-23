/**
 * @file contactFieldsStore.ts
 * @description Contacts field configuration via `/api/contacts/field-config`.
 * Thin adapter over the shared `createModuleSetupConfigApi` factory; the
 * migrate + sanitize + merge-with-defaults pipeline stays contacts-local.
 */
import {
  CONFIG_VERSION,
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
        const fallbackTabFields = fallback.fields[tabKey] || [];
        const existingKeys = new Set(fieldsList.map((f) => f.key));
        const missingSystemFields = fallbackTabFields.filter((f) => !existingKeys.has(f.key));
        mergedFields[tabKey] = [...fieldsList, ...missingSystemFields];
      }
    }
  }

  const existingColKeys = new Set((migrated.columnRegistry || []).map((col) => col.key));
  const missingColumns = (fallback.columnRegistry || []).filter((col) => !existingColKeys.has(col.key));
  const mergedColumnRegistry = [...(migrated.columnRegistry || fallback.columnRegistry || []), ...missingColumns];

  const merged: FieldConfig = {
    ...fallback,
    ...migrated,
    enabledTabs: migrated.enabledTabs ?? fallback.enabledTabs,
    requiredTabs: migrated.requiredTabs ?? fallback.requiredTabs,
    fields: mergedFields,
    columnRegistry: mergedColumnRegistry,
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

export const normalizeContactFieldConfig = (config: unknown): FieldConfig =>
  mergeWithDefaults((config as FieldConfig | null) ?? getContactFieldSystemDefaults());

const normalizeFieldConfig = normalizeContactFieldConfig;

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

import { apiContract } from "@/lib/api";

const api = createModuleSetupConfigApi<FieldConfig, unknown>({
  fetchFieldConfigFn: async (signal) => {
    const res = await apiContract.contacts.getFieldConfig({ query: undefined, extraHeaders: {} });
    return (res.body as any).config;
  },
  saveFieldConfigFn: async (config) => {
    const res = await apiContract.contacts.updateFieldConfig({ body: config as any });
    return (res.body as any).config;
  },
  fetchPreferencesFn: async (signal) => {
    const res = await apiContract.contacts.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as any).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.contacts.updatePreferences({ body: prefs as any });
    return (res.body as any).preferences;
  },
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
