import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/contexts/AuthContext";

function resolveValue<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as () => T)() : value;
}

export interface CreateModuleSetupConfigHooksOptions<
  TFieldConfig extends object,
  TPreferences extends object,
  TPreferencesInput = TPreferences,
> {
  fieldConfigQueryKey: readonly unknown[];
  preferencesQueryKey: readonly unknown[];
  fetchFieldConfig: (signal?: AbortSignal) => Promise<TFieldConfig>;
  saveFieldConfig: (config: TFieldConfig) => Promise<TFieldConfig>;
  setFieldConfigMemory?: (config: TFieldConfig) => void;
  fieldConfigPlaceholder: TFieldConfig | (() => TFieldConfig);
  fetchPreferences: (signal?: AbortSignal) => Promise<TPreferences>;
  savePreferences: (prefs: TPreferencesInput) => Promise<TPreferences>;
  setPreferencesMemory?: (prefs: TPreferences) => void;
  preferencesPlaceholder: TPreferences | (() => TPreferences);
  /** Students compose: prefs write also invalidates field-config. */
  invalidateFieldConfigOnPreferencesSave?: boolean;
}

/** Shared field-config + preferences Query/mutation hooks for module Setup. */
export function createModuleSetupConfigHooks<
  TFieldConfig extends object,
  TPreferences extends object,
  TPreferencesInput = TPreferences,
>({
  fieldConfigQueryKey,
  preferencesQueryKey,
  fetchFieldConfig,
  saveFieldConfig,
  setFieldConfigMemory,
  fieldConfigPlaceholder,
  fetchPreferences,
  savePreferences,
  setPreferencesMemory,
  preferencesPlaceholder,
  invalidateFieldConfigOnPreferencesSave = false,
}: CreateModuleSetupConfigHooksOptions<TFieldConfig, TPreferences, TPreferencesInput>) {
  function useFieldConfigQuery() {
    const { isAuthenticated } = useAuth();
    return useQuery({
      queryKey: fieldConfigQueryKey,
      queryFn: ({ signal }) => fetchFieldConfig(signal),
      enabled: isAuthenticated,
      // TanStack Query NonFunctionGuard cannot be proven for generic TFieldConfig.
      // @ts-expect-error generic placeholderData vs NonFunctionGuard<TFieldConfig>
      placeholderData: resolveValue(fieldConfigPlaceholder),
      staleTime: 60_000,
    });
  }

  function useFieldConfigMutation() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (config: TFieldConfig) => saveFieldConfig(config),
      onSuccess: (saved) => {
        setFieldConfigMemory?.(saved);
        queryClient.setQueryData(fieldConfigQueryKey, saved);
        void queryClient.invalidateQueries({ queryKey: fieldConfigQueryKey });
      },
    });
  }

  function usePreferencesQuery() {
    const { isAuthenticated } = useAuth();
    return useQuery({
      queryKey: preferencesQueryKey,
      queryFn: ({ signal }) => fetchPreferences(signal),
      enabled: isAuthenticated,
      // TanStack Query NonFunctionGuard cannot be proven for generic TPreferences.
      // @ts-expect-error generic placeholderData vs NonFunctionGuard<TPreferences>
      placeholderData: resolveValue(preferencesPlaceholder),
      staleTime: 60_000,
    });
  }

  function usePreferencesMutation() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (preferences: TPreferencesInput) => savePreferences(preferences),
      onSuccess: (saved) => {
        setPreferencesMemory?.(saved);
        queryClient.setQueryData(preferencesQueryKey, saved);
        void queryClient.invalidateQueries({ queryKey: preferencesQueryKey });
        if (invalidateFieldConfigOnPreferencesSave) {
          void queryClient.invalidateQueries({ queryKey: fieldConfigQueryKey });
        }
      },
    });
  }

  return {
    useFieldConfigQuery,
    useFieldConfigMutation,
    usePreferencesQuery,
    usePreferencesMutation,
  };
}
