/**
 * Attendance Setup field-config + preferences via typed REST.
 */
import {
  ATTENDANCE_MODULE_MANIFEST,
  composeAttendanceSettings,
  normalizeAttendanceModulePreferences,
  normalizeAttendanceSettings,
  stripAttendanceFieldConfigForPersist,
  type AttendanceModulePreferences,
  type AttendanceSettings,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

const FIELD_CONFIG_API = `${ATTENDANCE_MODULE_MANIFEST.restBasePath}/field-config`;
const PREFERENCES_API = `${ATTENDANCE_MODULE_MANIFEST.restBasePath}/preferences`;

let memoryFieldConfig: AttendanceSettings | null = null;
let memoryPreferences: AttendanceModulePreferences | null = null;

export function setAttendanceFieldConfigMemory(config: AttendanceSettings): void {
  memoryFieldConfig = normalizeAttendanceSettings(config);
}

export function setAttendancePreferencesMemory(preferences: AttendanceModulePreferences): void {
  memoryPreferences = normalizeAttendanceModulePreferences(preferences);
}

export async function fetchAttendanceFieldConfig(signal?: AbortSignal): Promise<AttendanceSettings> {
  const response = await apiJson<{ config: AttendanceSettings | null }>(FIELD_CONFIG_API, { signal });
  const merged = normalizeAttendanceSettings(response.config);
  memoryFieldConfig = merged;
  return merged;
}

export async function saveAttendanceFieldConfigAsync(
  config: AttendanceSettings,
): Promise<AttendanceSettings> {
  const body = stripAttendanceFieldConfigForPersist(config);
  const response = await apiJson<{ success: boolean; config: AttendanceSettings }>(FIELD_CONFIG_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeAttendanceSettings({
    ...(response.config ?? body),
    formTabs: response.config?.formTabs ?? config.formTabs,
  });
  memoryFieldConfig = saved;
  return saved;
}

export async function fetchAttendancePreferences(signal?: AbortSignal): Promise<AttendanceModulePreferences> {
  const response = await apiJson<{ preferences: AttendanceModulePreferences | null }>(PREFERENCES_API, { signal });
  const merged = normalizeAttendanceModulePreferences(response.preferences);
  memoryPreferences = merged;
  return merged;
}

export async function saveAttendancePreferencesAsync(
  preferences: AttendanceModulePreferences | AttendanceSettings,
): Promise<AttendanceModulePreferences> {
  const body = normalizeAttendanceModulePreferences(preferences as AttendanceModulePreferences);
  const response = await apiJson<{ success: boolean; preferences: AttendanceModulePreferences }>(PREFERENCES_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeAttendanceModulePreferences(response.preferences ?? body);
  memoryPreferences = saved;
  return saved;
}

export function getAttendanceSettingsMemoryFallback(): AttendanceSettings | null {
  if (!memoryFieldConfig) return null;
  return composeAttendanceSettings(
    memoryFieldConfig,
    memoryPreferences ?? normalizeAttendanceModulePreferences(null),
    memoryFieldConfig.formTabs,
  );
}
