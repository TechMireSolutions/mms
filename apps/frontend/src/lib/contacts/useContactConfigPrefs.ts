import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ContactPreferences } from "@mms/shared";
import {
  loadPreferences,
  savePreferences,
  savePreferencesAsync,
  setPreferencesMemory,
} from "@/lib/contacts/preferencesStorage";
import {
  CONTACTS_PREFERENCES_QUERY_KEY,
  useContactPreferencesQuery,
} from "@/tenant/features/contacts/hooks/useContactSetupConfig";

/**
 * Contacts preferences slice (separate REST document from field config).
 * Hydrates from the Query-backed `/api/contacts/preferences`, exposes optimistic
 * sync and async-persist updaters, and lets the parent re-read the Query cache
 * after config reloads.
 */
export function useContactConfigPrefs() {
  const queryClient = useQueryClient();
  const preferencesQuery = useContactPreferencesQuery();
  const [prefs, setPrefsState] = useState<ContactPreferences>(() => loadPreferences());

  useEffect(() => {
    if (!preferencesQuery.data) return;
    setPreferencesMemory(preferencesQuery.data);
    setPrefsState(preferencesQuery.data);
  }, [preferencesQuery.data]);

  const updatePrefs = useCallback((newPrefs: Partial<ContactPreferences>) => {
    setPrefsState((currentPreferences) => {
      const merged = { ...currentPreferences, ...newPrefs };
      savePreferences(merged);
      return merged;
    });
  }, []);

  const updatePrefsAsync = useCallback(
    async (newPrefs: Partial<ContactPreferences>): Promise<void> => {
      const merged = { ...prefs, ...newPrefs };
      const saved = await savePreferencesAsync(merged);
      setPrefsState(saved);
    },
    [prefs],
  );

  const syncFromQueryCache = useCallback(() => {
    const prefsData = queryClient.getQueryData<ContactPreferences>(CONTACTS_PREFERENCES_QUERY_KEY);
    setPrefsState(prefsData ?? loadPreferences());
  }, [queryClient]);

  return { prefs, updatePrefs, updatePrefsAsync, syncFromQueryCache };
}
