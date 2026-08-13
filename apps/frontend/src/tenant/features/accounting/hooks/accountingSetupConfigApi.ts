/**
 * Accounting Setup field-config + preferences via typed REST.
 */
import {
  ACCOUNTING_MODULE_MANIFEST,
  composeAccountingSettings,
  normalizeAccountingModulePreferences,
  normalizeAccountingSettings,
  stripAccountingFieldConfigForPersist,
  type AccountingModulePreferences,
  type AccountingSettings,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

const FIELD_CONFIG_API = `${ACCOUNTING_MODULE_MANIFEST.restBasePath}/field-config`;
const PREFERENCES_API = `${ACCOUNTING_MODULE_MANIFEST.restBasePath}/preferences`;

let memoryFieldConfig: AccountingSettings | null = null;
let memoryPreferences: AccountingModulePreferences | null = null;

export function setAccountingFieldConfigMemory(config: AccountingSettings): void {
  memoryFieldConfig = normalizeAccountingSettings(config);
}

export function setAccountingPreferencesMemory(preferences: AccountingModulePreferences): void {
  memoryPreferences = normalizeAccountingModulePreferences(preferences);
}

export async function fetchAccountingFieldConfig(signal?: AbortSignal): Promise<AccountingSettings> {
  const response = await apiJson<{ config: AccountingSettings | null }>(FIELD_CONFIG_API, { signal });
  const merged = normalizeAccountingSettings(response.config);
  memoryFieldConfig = merged;
  return merged;
}

export async function saveAccountingFieldConfigAsync(
  config: AccountingSettings,
): Promise<AccountingSettings> {
  const body = stripAccountingFieldConfigForPersist(config);
  const response = await apiJson<{ success: boolean; config: AccountingSettings }>(FIELD_CONFIG_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeAccountingSettings({
    ...(response.config ?? body),
    formTabs: response.config?.formTabs ?? config.formTabs,
  });
  memoryFieldConfig = saved;
  return saved;
}

export async function fetchAccountingPreferences(signal?: AbortSignal): Promise<AccountingModulePreferences> {
  const response = await apiJson<{ preferences: AccountingModulePreferences | null }>(PREFERENCES_API, { signal });
  const merged = normalizeAccountingModulePreferences(response.preferences);
  memoryPreferences = merged;
  return merged;
}

export async function saveAccountingPreferencesAsync(
  preferences: AccountingModulePreferences | AccountingSettings,
): Promise<AccountingModulePreferences> {
  const body = normalizeAccountingModulePreferences(preferences as AccountingModulePreferences);
  const response = await apiJson<{ success: boolean; preferences: AccountingModulePreferences }>(PREFERENCES_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeAccountingModulePreferences(response.preferences ?? body);
  memoryPreferences = saved;
  return saved;
}

export function getAccountingSettingsMemoryFallback(): AccountingSettings | null {
  if (!memoryFieldConfig) return null;
  return composeAccountingSettings(
    memoryFieldConfig,
    memoryPreferences ?? normalizeAccountingModulePreferences(null),
    memoryFieldConfig.formTabs,
  );
}
