/**
 * Students Setup field-config + preferences via typed REST.
 */
import {
  STUDENTS_MODULE_MANIFEST,
  composeStudentsSettings,
  normalizeStudentModulePreferences,
  normalizeStudentsSettings,
  stripStudentFieldConfigForPersist,
  type StudentModulePreferences,
  type StudentsSettings,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

const FIELD_CONFIG_API = `${STUDENTS_MODULE_MANIFEST.restBasePath}/field-config`;
const PREFERENCES_API = `${STUDENTS_MODULE_MANIFEST.restBasePath}/preferences`;

let memoryFieldConfig: StudentsSettings | null = null;
let memoryPreferences: StudentModulePreferences | null = null;

export function setStudentFieldConfigMemory(config: StudentsSettings): void {
  memoryFieldConfig = normalizeStudentsSettings(config);
}

export function setStudentPreferencesMemory(preferences: StudentModulePreferences): void {
  memoryPreferences = normalizeStudentModulePreferences(preferences);
}

export async function fetchStudentFieldConfig(signal?: AbortSignal): Promise<StudentsSettings> {
  const response = await apiJson<{ config: StudentsSettings | null }>(FIELD_CONFIG_API, { signal });
  const merged = normalizeStudentsSettings(response.config);
  memoryFieldConfig = merged;
  return merged;
}

export async function saveStudentFieldConfigAsync(
  config: StudentsSettings,
): Promise<StudentsSettings> {
  const body = stripStudentFieldConfigForPersist({
    ...config,
    version: config.version,
  });
  const response = await apiJson<{ success: boolean; config: StudentsSettings }>(FIELD_CONFIG_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // formTabs SSOT is custom_tabs (merged on BE GET) — prefer response over client body.
  const saved = normalizeStudentsSettings({
    ...(response.config ?? body),
    formTabs: response.config?.formTabs ?? config.formTabs,
  });
  memoryFieldConfig = saved;
  return saved;
}

export async function fetchStudentPreferences(
  signal?: AbortSignal,
): Promise<StudentModulePreferences> {
  const response = await apiJson<{ preferences: StudentModulePreferences }>(PREFERENCES_API, {
    signal,
  });
  const normalized = normalizeStudentModulePreferences(response.preferences ?? null);
  memoryPreferences = normalized;
  return normalized;
}

export async function saveStudentPreferencesAsync(
  preferences: StudentModulePreferences | StudentsSettings,
): Promise<StudentModulePreferences> {
  const normalized = normalizeStudentModulePreferences(preferences);
  const response = await apiJson<{ success: boolean; preferences: StudentModulePreferences }>(
    PREFERENCES_API,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    },
  );
  const saved = normalizeStudentModulePreferences(response.preferences ?? normalized);
  memoryPreferences = saved;
  return saved;
}

export function getStudentSettingsMemoryFallback(): StudentsSettings {
  return composeStudentsSettings(
    memoryFieldConfig,
    memoryPreferences ?? normalizeStudentModulePreferences(null),
    memoryFieldConfig?.formTabs,
  );
}
