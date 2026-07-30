/**
 * @file contactFieldsStore.ts
 * @description Tenant-cache persistence for contact field configuration.
 */
import { CONFIG_VERSION, FieldConfig, FieldDefinition } from "@mms/shared";
import { getObject, saveObject, saveObjectAsync } from "@/lib/db";
import { getContactFieldSystemDefaults, migrateContactFieldConfig } from "./contactFieldsMigration";
import { sanitizeContactFieldConfig } from "./contactFieldsSanitize";

/** @deprecated Use sanitizeContactFieldConfig — kept for stable public export. */
export function sanitizeConfig(config: FieldConfig): FieldConfig {
  return sanitizeContactFieldConfig(config);
}

/**
 * Loads the active field config.
 * Merges missing structural keys from shared schema defaults so partial saves are safe.
 */
export function loadFieldConfig(): FieldConfig {
  const fallback = getContactFieldSystemDefaults();
  const parsed = getObject("contact_field_config", fallback);
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

/**
 * Persists the active field config.
 * Always stamps the current CONFIG_VERSION before saving.
 */
export function saveFieldConfig(config: FieldConfig): void {
  saveObject("contact_field_config", { ...config, version: CONFIG_VERSION });
}

/** Persists contact field config and waits for server synchronization. */
export async function saveFieldConfigAsync(config: FieldConfig): Promise<void> {
  const result = await saveObjectAsync("contact_field_config", { ...config, version: CONFIG_VERSION });
  if (!result.ok) throw new Error("Failed to sync contact field configuration");
}
