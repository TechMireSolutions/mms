/**
 * Hasanat Setup field-config + preferences via typed REST.
 */
import {
  HASANAT_MODULE_MANIFEST,
  composeHasanatSettings,
  normalizeHasanatModulePreferences,
  normalizeHasanatSettings,
  stripHasanatFieldConfigForPersist,
  type HasanatModulePreferences,
  type HasanatSettings,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

const FIELD_CONFIG_API = `${HASANAT_MODULE_MANIFEST.restBasePath}/field-config`;
const PREFERENCES_API = `${HASANAT_MODULE_MANIFEST.restBasePath}/preferences`;

let memoryFieldConfig: HasanatSettings | null = null;
let memoryPreferences: HasanatModulePreferences | null = null;

export function setHasanatFieldConfigMemory(config: HasanatSettings): void {
  memoryFieldConfig = normalizeHasanatSettings(config);
}

export function setHasanatPreferencesMemory(preferences: HasanatModulePreferences): void {
  memoryPreferences = normalizeHasanatModulePreferences(preferences);
}

export async function fetchHasanatFieldConfig(signal?: AbortSignal): Promise<HasanatSettings> {
  const response = await apiJson<{ config: HasanatSettings | null }>(FIELD_CONFIG_API, { signal });
  const merged = normalizeHasanatSettings(response.config);
  memoryFieldConfig = merged;
  return merged;
}

export async function saveHasanatFieldConfigAsync(
  config: HasanatSettings,
): Promise<HasanatSettings> {
  const body = stripHasanatFieldConfigForPersist(config);
  const response = await apiJson<{ success: boolean; config: HasanatSettings }>(FIELD_CONFIG_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeHasanatSettings({
    ...(response.config ?? body),
    formTabs: response.config?.formTabs ?? config.formTabs,
  });
  memoryFieldConfig = saved;
  return saved;
}

export async function fetchHasanatPreferences(signal?: AbortSignal): Promise<HasanatModulePreferences> {
  const response = await apiJson<{ preferences: HasanatModulePreferences | null }>(PREFERENCES_API, { signal });
  const merged = normalizeHasanatModulePreferences(response.preferences);
  memoryPreferences = merged;
  return merged;
}

export async function saveHasanatPreferencesAsync(
  preferences: HasanatModulePreferences | HasanatSettings,
): Promise<HasanatModulePreferences> {
  const body = normalizeHasanatModulePreferences(preferences as HasanatModulePreferences);
  const response = await apiJson<{ success: boolean; preferences: HasanatModulePreferences }>(PREFERENCES_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeHasanatModulePreferences(response.preferences ?? body);
  memoryPreferences = saved;
  return saved;
}

export function getHasanatSettingsMemoryFallback(): HasanatSettings | null {
  if (!memoryFieldConfig) return null;
  return composeHasanatSettings(
    memoryFieldConfig,
    memoryPreferences ?? normalizeHasanatModulePreferences(null),
    memoryFieldConfig.formTabs,
  );
}
