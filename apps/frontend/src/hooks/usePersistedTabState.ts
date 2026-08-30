import { useCallback, useMemo } from "react";
import { normalizeModuleTierTabId } from "@mms/shared";
import { useUiPreference } from "@/lib/useUiStateStore";

/**
 * Tab state synced to backend UI state so module navigation does not reset the active tier across devices.
 */
export function usePersistedTabState<T extends string>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const [value, setUiPref] = useUiPreference<T>(key, defaultValue);

  const setPersisted = useCallback(
    (tabValue: T) => {
      setUiPref(normalizeModuleTierTabId(tabValue) as T);
    },
    [setUiPref],
  );

  const normalizedValue = useMemo(
    () => (normalizeModuleTierTabId(value as string) as T) || defaultValue,
    [value, defaultValue],
  );

  return [normalizedValue, setPersisted];
}
