/**
 * @file contactFieldsStore.ts
 * @description Contacts field configuration via `/api/contacts/field-config`.
 */
import { CONFIG_VERSION, FieldConfig, FieldDefinition } from "@mms/shared";
import { apiJson } from "@/lib/apiClient";
import { getContactFieldSystemDefaults, migrateContactFieldConfig } from "./contactFieldsMigration";
import { sanitizeContactFieldConfig } from "./contactFieldsSanitize";

const FIELD_CONFIG_API = "/api/contacts/field-config";

let memoryConfig: FieldConfig | null = null;

/** @deprecated Use sanitizeContactFieldConfig — kept for stable public export. */
export function sanitizeConfig(config: FieldConfig): FieldConfig {
  return sanitizeContactFieldConfig(config);
}

function mergeWithDefaults(parsed: FieldConfig): FieldConfig {
  const fallback = getContactFieldSystemDefaults();
  const migrated = migrateContactFieldConfig(parsed);

  const mergedFields: Record<string, FieldDefinition[]> = { ...fallback.fields };
  if (migrated.fields && typeof migrated.fields === "object") {
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

/** Strip formTabs — typed `custom_tabs` + `/api/custom-tabs` are the write SSOT. */
function fieldConfigWithoutFormTabs(config: FieldConfig): Omit<FieldConfig, "formTabs"> & {
  version: number;
} {
  const { formTabs: _formTabs, ...rest } = config;
  return { ...rest, version: CONFIG_VERSION };
}

/**
 * Sync read — last hydrated server config or system defaults.
 * Prefer Query (`useContactFieldConfigQuery`) for authenticated loads.
 */
export function loadFieldConfig(): FieldConfig {
  if (memoryConfig) return memoryConfig;
  return getContactFieldSystemDefaults();
}

export function setFieldConfigMemory(config: FieldConfig): void {
  memoryConfig = sanitizeContactFieldConfig(config);
}

export async function fetchFieldConfig(signal?: AbortSignal): Promise<FieldConfig> {
  const response = await apiJson<{ config: FieldConfig | null }>(FIELD_CONFIG_API, { signal });
  const merged = response.config
    ? mergeWithDefaults(response.config)
    : getContactFieldSystemDefaults();
  memoryConfig = merged;
  return merged;
}

/** Optimistic local write — does not hit the server. Prefer saveFieldConfigAsync. */
export function saveFieldConfig(config: FieldConfig): void {
  memoryConfig = sanitizeContactFieldConfig({
    ...config,
    version: CONFIG_VERSION,
  });
}

/** Persists contact field config via REST and updates memory. */
export async function saveFieldConfigAsync(config: FieldConfig): Promise<FieldConfig> {
  const body = fieldConfigWithoutFormTabs(config);
  const response = await apiJson<{ success: boolean; config: FieldConfig }>(FIELD_CONFIG_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = response.config
    ? mergeWithDefaults({ ...response.config, formTabs: config.formTabs })
    : mergeWithDefaults({ ...config, version: CONFIG_VERSION });
  memoryConfig = saved;
  return saved;
}
