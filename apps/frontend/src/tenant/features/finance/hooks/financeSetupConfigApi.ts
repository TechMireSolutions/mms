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
import { apiContract } from "@/lib/api";

const FIELD_CONFIG_API = `${FINANCE_MODULE_MANIFEST.restBasePath}/field-config`;

let memoryFieldConfig: FinanceSettings | null = null;
let memoryPreferences: FinanceModulePreferences | null = null;

export function setFinanceFieldConfigMemory(config: FinanceSettings): void {
  memoryFieldConfig = normalizeFinanceSettings(config);
}

export function setFinancePreferencesMemory(preferences: FinanceModulePreferences): void {
  memoryPreferences = normalizeFinanceModulePreferences(preferences);
}

export async function fetchFinanceFieldConfig(signal?: AbortSignal): Promise<FinanceSettings> {
  const response = await apiContract.finance.getFieldConfig({ query: {} });
  if (response.status !== 200) throw new Error("Failed to fetch finance field config");
  const merged = normalizeFinanceSettings(response.body.config);
  memoryFieldConfig = merged;
  return merged;
}

export async function saveFinanceFieldConfigAsync(
  config: FinanceSettings,
): Promise<FinanceSettings> {
  const body = stripFinanceFieldConfigForPersist(config);
  const response = await apiContract.finance.updateFieldConfig({ body });
  if (response.status !== 200) throw new Error("Failed to update finance field config");
  const saved = normalizeFinanceSettings({
    ...(response.body.config as any ?? body),
    formTabs: (response.body.config as any)?.formTabs ?? config.formTabs,
  });
  memoryFieldConfig = saved;
  return saved;
}

export async function fetchFinancePreferences(signal?: AbortSignal): Promise<FinanceModulePreferences> {
  const response = await apiContract.finance.getPreferences({ query: {} });
  if (response.status !== 200) throw new Error("Failed to fetch finance preferences");
  const merged = normalizeFinanceModulePreferences(response.body.preferences as any);
  memoryPreferences = merged;
  return merged;
}

export async function saveFinancePreferencesAsync(
  preferences: FinanceModulePreferences,
): Promise<FinanceModulePreferences> {
  const body = normalizeFinanceModulePreferences(preferences);
  const response = await apiContract.finance.updatePreferences({ body });
  if (response.status !== 200) throw new Error("Failed to update finance preferences");
  const saved = normalizeFinanceModulePreferences((response.body.preferences as any) ?? body);
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
