/**
 * Enrollments Setup field-config + preferences via typed REST.
 */
import {
  ENROLLMENTS_MODULE_MANIFEST,
  composeEnrollmentsSettings,
  normalizeEnrollmentModulePreferences,
  normalizeEnrollmentsSettings,
  stripEnrollmentFieldConfigForPersist,
  type EnrollmentModulePreferences,
  type EnrollmentsSettings,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

const FIELD_CONFIG_API = `${ENROLLMENTS_MODULE_MANIFEST.restBasePath}/field-config`;
const PREFERENCES_API = `${ENROLLMENTS_MODULE_MANIFEST.restBasePath}/preferences`;

let memoryFieldConfig: EnrollmentsSettings | null = null;
let memoryPreferences: EnrollmentModulePreferences | null = null;

export function setEnrollmentFieldConfigMemory(config: EnrollmentsSettings): void {
  memoryFieldConfig = normalizeEnrollmentsSettings(config);
}

export function setEnrollmentPreferencesMemory(preferences: EnrollmentModulePreferences): void {
  memoryPreferences = normalizeEnrollmentModulePreferences(preferences);
}

export async function fetchEnrollmentFieldConfig(signal?: AbortSignal): Promise<EnrollmentsSettings> {
  const response = await apiJson<{ config: EnrollmentsSettings | null }>(FIELD_CONFIG_API, { signal });
  const merged = normalizeEnrollmentsSettings(response.config);
  memoryFieldConfig = merged;
  return merged;
}

export async function saveEnrollmentFieldConfigAsync(
  config: EnrollmentsSettings,
): Promise<EnrollmentsSettings> {
  const body = stripEnrollmentFieldConfigForPersist(config);
  const response = await apiJson<{ success: boolean; config: EnrollmentsSettings }>(FIELD_CONFIG_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeEnrollmentsSettings({
    ...(response.config ?? body),
    formTabs: response.config?.formTabs ?? config.formTabs,
  });
  memoryFieldConfig = saved;
  return saved;
}

export async function fetchEnrollmentPreferences(
  signal?: AbortSignal,
): Promise<EnrollmentModulePreferences> {
  const response = await apiJson<{ preferences: EnrollmentModulePreferences }>(PREFERENCES_API, {
    signal,
  });
  const normalized = normalizeEnrollmentModulePreferences(response.preferences ?? null);
  memoryPreferences = normalized;
  return normalized;
}

export async function saveEnrollmentPreferencesAsync(
  preferences: EnrollmentModulePreferences | EnrollmentsSettings,
): Promise<EnrollmentModulePreferences> {
  const normalized = normalizeEnrollmentModulePreferences(preferences);
  const response = await apiJson<{ success: boolean; preferences: EnrollmentModulePreferences }>(
    PREFERENCES_API,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    },
  );
  const saved = normalizeEnrollmentModulePreferences(response.preferences ?? normalized);
  memoryPreferences = saved;
  return saved;
}

export function getEnrollmentSettingsMemoryFallback(): EnrollmentsSettings {
  return composeEnrollmentsSettings(
    memoryFieldConfig,
    memoryPreferences ?? normalizeEnrollmentModulePreferences(null),
    memoryFieldConfig?.formTabs,
  );
}
