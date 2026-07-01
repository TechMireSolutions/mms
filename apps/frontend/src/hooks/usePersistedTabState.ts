import { useCallback, useState } from "react";
import { normalizeModuleTierTabId } from "@mms/shared";

/**
 * Tab state synced to sessionStorage so module navigation does not reset the active tier.
 */
export function usePersistedTabState<T extends string>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (!saved) return defaultValue;
      return normalizeModuleTierTabId(saved) as T;
    } catch {
      return defaultValue;
    }
  });

  const setPersisted = useCallback(
    (tabValue: T) => {
      setValue(tabValue);
      try {
        sessionStorage.setItem(key, tabValue);
      } catch {
        /* sessionStorage unavailable */
      }
    },
    [key],
  );

  return [value, setPersisted];
}
