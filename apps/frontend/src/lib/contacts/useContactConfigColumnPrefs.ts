import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  mergeModuleColumnPreferences,
  migrateContactColumnPreferenceKeys,
  type ContactColumnPreference,
  type ColumnRegistryEntry,
} from "@mms/shared";
import {
  loadModuleColumnPreferences,
  saveModuleColumnPreferenceList,
  saveModuleColumnRegistry,
} from "@/lib/columnPreferences/moduleColumnPreferencesStorage";
import {
  useContactColumnPrefs,
  useContactColumnPrefsMutation,
} from "@/tenant/hooks/collections/contacts";

function toContactColumnPreferences(
  columnRegistry: ColumnRegistryEntry[],
): ContactColumnPreference[] {
  return columnRegistry.map(({ key, enabled, order, width }) => {
    const preference: ContactColumnPreference = { key, enabled, order };
    if (typeof width === "number") {
      preference.width = width;
    }
    return preference;
  });
}

export function useContactConfigColumnPrefs(userId: string | number | undefined) {
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useContactColumnPrefs({
    enabled: Boolean(userId),
  });
  const { mutate: saveColumnPrefs } = useContactColumnPrefsMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [localUserColumnOverlay, setLocalUserColumnOverlay] =
    useState<ContactColumnPreference[] | null>(null);
  const saveServerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawUserColumnOverlay = useMemo(() => {
    if (localUserColumnOverlay) {
      return migrateContactColumnPreferenceKeys(localUserColumnOverlay);
    }
    const scopedUserId = userId ? String(userId) : "";
    const localRaw = scopedUserId ? loadModuleColumnPreferences("contacts", scopedUserId) : null;
    const local = localRaw ? migrateContactColumnPreferenceKeys(localRaw) : null;
    if (columnPrefsLoaded && serverColumnPrefs && serverColumnPrefs.length > 0) {
      const server = migrateContactColumnPreferenceKeys(serverColumnPrefs);
      return mergeModuleColumnPreferences(server, local) ?? server;
    }
    return local;
  }, [columnPrefsLoaded, localUserColumnOverlay, serverColumnPrefs, userId]);

  useEffect(() => {
    return () => {
      if (saveServerTimerRef.current) clearTimeout(saveServerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setLocalUserColumnOverlay(null);
      migratedLocalColumnPrefs.current = false;
      return;
    }
    if (!columnPrefsLoaded) return;

    const scopedUserId = String(userId);
    const localRaw = loadModuleColumnPreferences("contacts", scopedUserId);
    const local = localRaw ? migrateContactColumnPreferenceKeys(localRaw) : null;

    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      const server = migrateContactColumnPreferenceKeys(serverColumnPrefs);
      const merged = mergeModuleColumnPreferences(server, local) ?? server;
      saveModuleColumnPreferenceList("contacts", scopedUserId, merged);
      return;
    }

    if (local?.length && !migratedLocalColumnPrefs.current) {
      migratedLocalColumnPrefs.current = true;
      saveColumnPrefs(local);
    }
  }, [userId, columnPrefsLoaded, serverColumnPrefs, saveColumnPrefs]);

  const updateUserColumnLayout = useCallback(
    (columnRegistry: ColumnRegistryEntry[]) => {
      const scopedUserId = userId ? String(userId) : "";
      if (!scopedUserId) return;

      saveModuleColumnRegistry("contacts", scopedUserId, columnRegistry);
      const preferences = toContactColumnPreferences(columnRegistry);
      setLocalUserColumnOverlay(preferences);
      if (saveServerTimerRef.current) clearTimeout(saveServerTimerRef.current);
      saveServerTimerRef.current = setTimeout(() => {
        saveColumnPrefs(preferences);
        saveServerTimerRef.current = null;
      }, 300);
    },
    [saveColumnPrefs, userId],
  );

  return {
    rawUserColumnOverlay,
    updateUserColumnLayout,
  };
}
