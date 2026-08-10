import { apiJson } from "@/lib/apiClient";

export interface CreateModuleSetupConfigApiOptions<
  TFieldConfig extends { formTabs?: unknown[] },
  TPreferences,
> {
  restBasePath: string;
  normalizeFieldConfig: (config: unknown) => TFieldConfig;
  composeSettings: (
    fieldConfig: unknown,
    preferences: unknown,
    formTabs?: unknown[],
  ) => TFieldConfig;
  normalizePrefs: (prefs: unknown) => TPreferences;
  stripFieldConfig: (config: TFieldConfig) => Record<string, unknown>;
}

/**
 * Shared Setup field-config + preferences REST + memory-cache module.
 * Teachers/Students adapters pass module compose/normalize/strip functions.
 */
export function createModuleSetupConfigApi<
  TFieldConfig extends { formTabs?: unknown[] },
  TPreferences,
>({
  restBasePath,
  normalizeFieldConfig,
  composeSettings,
  normalizePrefs,
  stripFieldConfig,
}: CreateModuleSetupConfigApiOptions<TFieldConfig, TPreferences>) {
  const FIELD_CONFIG_API = `${restBasePath}/field-config`;
  const PREFERENCES_API = `${restBasePath}/preferences`;

  let memoryFieldConfig: TFieldConfig | null = null;
  let memoryPreferences: TPreferences | null = null;

  function setFieldConfigMemory(config: TFieldConfig): void {
    memoryFieldConfig = normalizeFieldConfig(config);
  }

  function setPreferencesMemory(preferences: TPreferences): void {
    memoryPreferences = normalizePrefs(preferences);
  }

  async function fetchFieldConfig(signal?: AbortSignal): Promise<TFieldConfig> {
    const response = await apiJson<{ config: TFieldConfig | null }>(FIELD_CONFIG_API, { signal });
    const merged = normalizeFieldConfig(response.config);
    memoryFieldConfig = merged;
    return merged;
  }

  async function saveFieldConfigAsync(config: TFieldConfig): Promise<TFieldConfig> {
    const body = stripFieldConfig(config);
    const response = await apiJson<{ success: boolean; config: TFieldConfig }>(FIELD_CONFIG_API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const saved = normalizeFieldConfig({
      ...(response.config ?? body),
      formTabs: response.config?.formTabs ?? config.formTabs,
    });
    memoryFieldConfig = saved;
    return saved;
  }

  async function fetchPreferences(signal?: AbortSignal): Promise<TPreferences> {
    const response = await apiJson<{ preferences: TPreferences }>(PREFERENCES_API, {
      signal,
    });
    const normalized = normalizePrefs(response.preferences ?? null);
    memoryPreferences = normalized;
    return normalized;
  }

  async function savePreferencesAsync(
    preferences: TPreferences | TFieldConfig,
  ): Promise<TPreferences> {
    const normalized = normalizePrefs(preferences);
    const response = await apiJson<{ success: boolean; preferences: TPreferences }>(
      PREFERENCES_API,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
      },
    );
    const saved = normalizePrefs(response.preferences ?? normalized);
    memoryPreferences = saved;
    return saved;
  }

  function getSettingsMemoryFallback(): TFieldConfig {
    return composeSettings(
      memoryFieldConfig,
      memoryPreferences ?? normalizePrefs(null),
      memoryFieldConfig?.formTabs,
    );
  }

  return {
    setFieldConfigMemory,
    setPreferencesMemory,
    fetchFieldConfig,
    saveFieldConfigAsync,
    fetchPreferences,
    savePreferencesAsync,
    getSettingsMemoryFallback,
  };
}
