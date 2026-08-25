import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/contexts/AuthContext";

function resolveValue<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as () => T)() : value;
}

export interface CreateModuleSetupConfigHooksOptions<
  TPreferences extends object,
  TPreferencesInput = TPreferences,
> {
  preferencesQueryKey: readonly unknown[];
  fetchPreferences: (signal?: AbortSignal) => Promise<TPreferences>;
  savePreferences: (prefs: TPreferencesInput) => Promise<TPreferences>;
  setPreferencesMemory?: (prefs: TPreferences) => void;
  preferencesPlaceholder: TPreferences | (() => TPreferences);
}

/** Shared preferences Query/mutation hooks for module Setup. */
export function createModuleSetupConfigHooks<
  TPreferences extends object,
  TPreferencesInput = TPreferences,
>({
  preferencesQueryKey,
  fetchPreferences,
  savePreferences,
  setPreferencesMemory,
  preferencesPlaceholder,
}: CreateModuleSetupConfigHooksOptions<TPreferences, TPreferencesInput>) {

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
      },
    });
  }

  return {
    usePreferencesQuery,
    usePreferencesMutation,
  };
}
