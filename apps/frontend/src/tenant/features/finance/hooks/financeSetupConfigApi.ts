/**
 * Finance Setup field-config + preferences via typed REST.
 */
import {
  FINANCE_MODULE_MANIFEST,
  composeFinanceSettings,
  normalizeFinanceModulePreferences,
  normalizeFinanceSettings,
  stripFinanceFieldConfigForPersist,
  type FinanceModulePreferences,
  type FinanceSettings,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

const FIELD_CONFIG_API = `${FINANCE_MODULE_MANIFEST.restBasePath}/field-config`;
const PREFERENCES_API = `${FINANCE_MODULE_MANIFEST.restBasePath}/preferences`;

let memoryFieldConfig: FinanceSettings | null = null;
let memoryPreferences: FinanceModulePreferences | null = null;

export function setFinanceFieldConfigMemory(config: FinanceSettings): void {
  memoryFieldConfig = normalizeFinanceSettings(config);
}

export function setFinancePreferencesMemory(preferences: FinanceModulePreferences): void {
  memoryPreferences = normalizeFinanceModulePreferences(preferences);
}

export async function fetchFinanceFieldConfig(signal?: AbortSignal): Promise<FinanceSettings> {
  const response = await apiJson<{ config: FinanceSettings | null }>(FIELD_CONFIG_API, { signal });
  const merged = normalizeFinanceSettings(response.config);
  memoryFieldConfig = merged;
  return merged;
}

export async function saveFinanceFieldConfigAsync(
  config: FinanceSettings,
): Promise<FinanceSettings> {
  const body = stripFinanceFieldConfigForPersist(config);
  const response = await apiJson<{ success: boolean; config: FinanceSettings }>(FIELD_CONFIG_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeFinanceSettings({
    ...(response.config ?? body),
    formTabs: response.config?.formTabs ?? config.formTabs,
  });
  memoryFieldConfig = saved;
  return saved;
}

export async function fetchFinancePreferences(signal?: AbortSignal): Promise<FinanceModulePreferences> {
  const response = await apiJson<{ preferences: FinanceModulePreferences | null }>(PREFERENCES_API, { signal });
  const merged = normalizeFinanceModulePreferences(response.preferences);
  memoryPreferences = merged;
  return merged;
}

export async function saveFinancePreferencesAsync(
  preferences: FinanceModulePreferences,
): Promise<FinanceModulePreferences> {
  const body = normalizeFinanceModulePreferences(preferences);
  const response = await apiJson<{ success: boolean; preferences: FinanceModulePreferences }>(PREFERENCES_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeFinanceModulePreferences(response.preferences ?? body);
  memoryPreferences = saved;
  return saved;
}

export function getFinanceSettingsMemoryFallback(): FinanceSettings | null {
  if (!memoryFieldConfig) return null;
  return composeFinanceSettings(
    memoryFieldConfig,
    memoryPreferences ?? normalizeFinanceModulePreferences(null),
    memoryFieldConfig.formTabs,
  );
}
