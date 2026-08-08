/**
 * Teachers Setup field-config + preferences via typed REST.
 */
import {
  TEACHERS_MODULE_MANIFEST,
  composeTeachersSettings,
  normalizeTeacherModulePreferences,
  normalizeTeachersSettings,
  stripTeacherFieldConfigForPersist,
  type TeacherModulePreferences,
  type TeachersSettings,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

const FIELD_CONFIG_API = `${TEACHERS_MODULE_MANIFEST.restBasePath}/field-config`;
const PREFERENCES_API = `${TEACHERS_MODULE_MANIFEST.restBasePath}/preferences`;

let memoryFieldConfig: TeachersSettings | null = null;
let memoryPreferences: TeacherModulePreferences | null = null;

export function setTeacherFieldConfigMemory(config: TeachersSettings): void {
  memoryFieldConfig = normalizeTeachersSettings(config);
}

export function setTeacherPreferencesMemory(preferences: TeacherModulePreferences): void {
  memoryPreferences = normalizeTeacherModulePreferences(preferences);
}

export async function fetchTeacherFieldConfig(signal?: AbortSignal): Promise<TeachersSettings> {
  const response = await apiJson<{ config: TeachersSettings | null }>(FIELD_CONFIG_API, { signal });
  const merged = normalizeTeachersSettings(response.config);
  memoryFieldConfig = merged;
  return merged;
}

export async function saveTeacherFieldConfigAsync(
  config: TeachersSettings,
): Promise<TeachersSettings> {
  const body = stripTeacherFieldConfigForPersist(config);
  const response = await apiJson<{ success: boolean; config: TeachersSettings }>(FIELD_CONFIG_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeTeachersSettings({
    ...(response.config ?? body),
    formTabs: response.config?.formTabs ?? config.formTabs,
  });
  memoryFieldConfig = saved;
  return saved;
}

export async function fetchTeacherPreferences(
  signal?: AbortSignal,
): Promise<TeacherModulePreferences> {
  const response = await apiJson<{ preferences: TeacherModulePreferences }>(PREFERENCES_API, {
    signal,
  });
  const normalized = normalizeTeacherModulePreferences(response.preferences ?? null);
  memoryPreferences = normalized;
  return normalized;
}

export async function saveTeacherPreferencesAsync(
  preferences: TeacherModulePreferences | TeachersSettings,
): Promise<TeacherModulePreferences> {
  const normalized = normalizeTeacherModulePreferences(preferences);
  const response = await apiJson<{ success: boolean; preferences: TeacherModulePreferences }>(
    PREFERENCES_API,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    },
  );
  const saved = normalizeTeacherModulePreferences(response.preferences ?? normalized);
  memoryPreferences = saved;
  return saved;
}

export function getTeacherSettingsMemoryFallback(): TeachersSettings {
  return composeTeachersSettings(
    memoryFieldConfig,
    memoryPreferences ?? normalizeTeacherModulePreferences(null),
    memoryFieldConfig?.formTabs,
  );
}
