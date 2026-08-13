/**
 * Examinations Setup field-config + preferences via typed REST.
 */
import {
  EXAMINATIONS_MODULE_MANIFEST,
  composeExaminationsSettings,
  normalizeExaminationsModulePreferences,
  normalizeExaminationsSettings,
  stripExaminationsFieldConfigForPersist,
  type ExaminationsModulePreferences,
  type ExaminationsSettings,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

const FIELD_CONFIG_API = `${EXAMINATIONS_MODULE_MANIFEST.restBasePath}/field-config`;
const PREFERENCES_API = `${EXAMINATIONS_MODULE_MANIFEST.restBasePath}/preferences`;

let memoryFieldConfig: ExaminationsSettings | null = null;
let memoryPreferences: ExaminationsModulePreferences | null = null;

export function setExaminationFieldConfigMemory(config: ExaminationsSettings): void {
  memoryFieldConfig = normalizeExaminationsSettings(config);
}

export function setExaminationPreferencesMemory(preferences: ExaminationsModulePreferences): void {
  memoryPreferences = normalizeExaminationsModulePreferences(preferences);
}

export async function fetchExaminationFieldConfig(signal?: AbortSignal): Promise<ExaminationsSettings> {
  const response = await apiJson<{ config: ExaminationsSettings | null }>(FIELD_CONFIG_API, { signal });
  const merged = normalizeExaminationsSettings(response.config);
  memoryFieldConfig = merged;
  return merged;
}

export async function saveExaminationFieldConfigAsync(
  config: ExaminationsSettings,
): Promise<ExaminationsSettings> {
  const body = stripExaminationsFieldConfigForPersist(config);
  const response = await apiJson<{ success: boolean; config: ExaminationsSettings }>(FIELD_CONFIG_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeExaminationsSettings({
    ...(response.config ?? body),
    formTabs: response.config?.formTabs ?? config.formTabs,
  });
  memoryFieldConfig = saved;
  return saved;
}

export async function fetchExaminationPreferences(signal?: AbortSignal): Promise<ExaminationsModulePreferences> {
  const response = await apiJson<{ preferences: ExaminationsModulePreferences | null }>(PREFERENCES_API, { signal });
  const merged = normalizeExaminationsModulePreferences(response.preferences);
  memoryPreferences = merged;
  return merged;
}

export async function saveExaminationPreferencesAsync(
  preferences: ExaminationsModulePreferences | ExaminationsSettings,
): Promise<ExaminationsModulePreferences> {
  const body = normalizeExaminationsModulePreferences(preferences as ExaminationsModulePreferences);
  const response = await apiJson<{ success: boolean; preferences: ExaminationsModulePreferences }>(PREFERENCES_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeExaminationsModulePreferences(response.preferences ?? body);
  memoryPreferences = saved;
  return saved;
}

export function getExaminationSettingsMemoryFallback(): ExaminationsSettings | null {
  if (!memoryFieldConfig) return null;
  return composeExaminationsSettings(
    memoryFieldConfig,
    memoryPreferences ?? normalizeExaminationsModulePreferences(null),
    memoryFieldConfig.formTabs,
  );
}
