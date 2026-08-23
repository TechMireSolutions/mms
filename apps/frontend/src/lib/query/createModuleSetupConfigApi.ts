
export interface CreateModuleSetupConfigApiOptions<
  TFieldConfig extends { formTabs?: unknown[] },
  TPreferences,
> {
  fetchFieldConfigFn: (signal?: AbortSignal) => Promise<TFieldConfig | null>;
  saveFieldConfigFn: (config: unknown) => Promise<TFieldConfig>;
  fetchPreferencesFn: (signal?: AbortSignal) => Promise<TPreferences | null>;
  savePreferencesFn: (prefs: unknown) => Promise<TPreferences>;
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
  fetchFieldConfigFn,
  saveFieldConfigFn,
  fetchPreferencesFn,
  savePreferencesFn,
  normalizeFieldConfig,
  composeSettings,
  normalizePrefs,
  stripFieldConfig,
}: CreateModuleSetupConfigApiOptions<TFieldConfig, TPreferences>) {
  let memoryFieldConfig: TFieldConfig | null = null;
  let memoryPreferences: TPreferences | null = null;

  function setFieldConfigMemory(config: TFieldConfig): void {
    memoryFieldConfig = normalizeFieldConfig(config);
  }

  function setPreferencesMemory(preferences: TPreferences): void {
    memoryPreferences = normalizePrefs(preferences);
  }

  async function fetchFieldConfig(signal?: AbortSignal): Promise<TFieldConfig> {
    const response = await fetchFieldConfigFn(signal);
    const merged = normalizeFieldConfig(response);
    memoryFieldConfig = merged;
    return merged;
  }

  async function saveFieldConfigAsync(config: TFieldConfig): Promise<TFieldConfig> {
    const body = stripFieldConfig(config);
    const response = await saveFieldConfigFn(body);
    const saved = normalizeFieldConfig({
      ...(response ?? body),
      formTabs: (response as any)?.formTabs ?? config.formTabs,
    });
    memoryFieldConfig = saved;
    return saved;
  }

  async function fetchPreferences(signal?: AbortSignal): Promise<TPreferences> {
    const response = await fetchPreferencesFn(signal);
    const normalized = normalizePrefs(response ?? null);
    memoryPreferences = normalized;
    return normalized;
  }

  async function savePreferencesAsync(
    preferences: TPreferences | TFieldConfig,
  ): Promise<TPreferences> {
    const normalized = normalizePrefs(preferences);
    const response = await savePreferencesFn(normalized);
    const saved = normalizePrefs(response ?? normalized);
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
