/**
 * Users Setup field-config + preferences via typed REST.
 */
import {
  USERS_MODULE_MANIFEST,
  composeUsersSettings,
  normalizeUserModulePreferences,
  normalizeUsersSettings,
  stripUserFieldConfigForPersist,
  type UserModulePreferences,
  type UsersSettings,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

const FIELD_CONFIG_API = `${USERS_MODULE_MANIFEST.restBasePath}/field-config`;
const PREFERENCES_API = `${USERS_MODULE_MANIFEST.restBasePath}/preferences`;

let memoryFieldConfig: UsersSettings | null = null;
let memoryPreferences: UserModulePreferences | null = null;

export function setUserFieldConfigMemory(config: UsersSettings): void {
  memoryFieldConfig = normalizeUsersSettings(config);
}

export function setUserPreferencesMemory(preferences: UserModulePreferences): void {
  memoryPreferences = normalizeUserModulePreferences(preferences);
}

export async function fetchUserFieldConfig(signal?: AbortSignal): Promise<UsersSettings> {
  const response = await apiJson<{ config: UsersSettings | null }>(FIELD_CONFIG_API, { signal });
  const merged = normalizeUsersSettings(response.config);
  memoryFieldConfig = merged;
  return merged;
}

export async function saveUserFieldConfigAsync(config: UsersSettings): Promise<UsersSettings> {
  const body = stripUserFieldConfigForPersist(config);
  const response = await apiJson<{ success: boolean; config: UsersSettings }>(FIELD_CONFIG_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeUsersSettings({
    ...(response.config ?? body),
    formTabs: response.config?.formTabs ?? config.formTabs,
  });
  memoryFieldConfig = saved;
  return saved;
}

export async function fetchUserPreferences(signal?: AbortSignal): Promise<UserModulePreferences> {
  const response = await apiJson<{ preferences: UserModulePreferences }>(PREFERENCES_API, {
    signal,
  });
  const normalized = normalizeUserModulePreferences(response.preferences ?? null);
  memoryPreferences = normalized;
  return normalized;
}

export async function saveUserPreferencesAsync(
  preferences: UserModulePreferences | UsersSettings,
): Promise<UserModulePreferences> {
  const normalized = normalizeUserModulePreferences(preferences);
  const response = await apiJson<{ success: boolean; preferences: UserModulePreferences }>(
    PREFERENCES_API,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    },
  );
  const saved = normalizeUserModulePreferences(response.preferences ?? normalized);
  memoryPreferences = saved;
  return saved;
}

export function getUserSettingsMemoryFallback(): UsersSettings {
  return composeUsersSettings(
    memoryFieldConfig,
    memoryPreferences ?? normalizeUserModulePreferences(null),
    memoryFieldConfig?.formTabs,
  );
}
