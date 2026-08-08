/**
 * Sessions Setup field-config + preferences via typed REST.
 */
import {
  SESSIONS_MODULE_MANIFEST,
  composeSessionsSettings,
  normalizeSessionModulePreferences,
  normalizeSessionsSettings,
  stripSessionFieldConfigForPersist,
  type SessionModulePreferences,
  type SessionsSettings,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

const FIELD_CONFIG_API = `${SESSIONS_MODULE_MANIFEST.restBasePath}/field-config`;
const PREFERENCES_API = `${SESSIONS_MODULE_MANIFEST.restBasePath}/preferences`;

let memoryFieldConfig: SessionsSettings | null = null;
let memoryPreferences: SessionModulePreferences | null = null;

export function setSessionFieldConfigMemory(config: SessionsSettings): void {
  memoryFieldConfig = normalizeSessionsSettings(config);
}

export function setSessionPreferencesMemory(preferences: SessionModulePreferences): void {
  memoryPreferences = normalizeSessionModulePreferences(preferences);
}

export async function fetchSessionFieldConfig(signal?: AbortSignal): Promise<SessionsSettings> {
  const response = await apiJson<{ config: SessionsSettings | null }>(FIELD_CONFIG_API, { signal });
  const merged = normalizeSessionsSettings(response.config);
  memoryFieldConfig = merged;
  return merged;
}

export async function saveSessionFieldConfigAsync(
  config: SessionsSettings,
): Promise<SessionsSettings> {
  const body = stripSessionFieldConfigForPersist(config);
  const response = await apiJson<{ success: boolean; config: SessionsSettings }>(FIELD_CONFIG_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const saved = normalizeSessionsSettings({
    ...(response.config ?? body),
    formTabs: response.config?.formTabs ?? config.formTabs,
  });
  memoryFieldConfig = saved;
  return saved;
}

export async function fetchSessionPreferences(
  signal?: AbortSignal,
): Promise<SessionModulePreferences> {
  const response = await apiJson<{ preferences: SessionModulePreferences }>(PREFERENCES_API, {
    signal,
  });
  const normalized = normalizeSessionModulePreferences(response.preferences ?? null);
  memoryPreferences = normalized;
  return normalized;
}

export async function saveSessionPreferencesAsync(
  preferences: SessionModulePreferences | SessionsSettings,
): Promise<SessionModulePreferences> {
  const normalized = normalizeSessionModulePreferences(preferences);
  const response = await apiJson<{ success: boolean; preferences: SessionModulePreferences }>(
    PREFERENCES_API,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    },
  );
  const saved = normalizeSessionModulePreferences(response.preferences ?? normalized);
  memoryPreferences = saved;
  return saved;
}

export function getSessionSettingsMemoryFallback(): SessionsSettings {
  return composeSessionsSettings(
    memoryFieldConfig,
    memoryPreferences ?? normalizeSessionModulePreferences(null),
    memoryFieldConfig?.formTabs,
  );
}
