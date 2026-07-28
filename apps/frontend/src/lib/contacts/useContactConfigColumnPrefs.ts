import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ContactColumnPreference, type ColumnRegistryEntry } from "@mms/shared";
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

  const rawUserColumnOverlay = useMemo(() => {
    if (localUserColumnOverlay) {
      return localUserColumnOverlay;
    }
    if (columnPrefsLoaded && serverColumnPrefs && serverColumnPrefs.length > 0) {
      return serverColumnPrefs;
    }
    const scopedUserId = userId ? String(userId) : "";
    if (scopedUserId) {
      return loadModuleColumnPreferences("contacts", scopedUserId);
    }
    return null;
  }, [columnPrefsLoaded, localUserColumnOverlay, serverColumnPrefs, userId]);

  useEffect(() => {
    if (!userId) {
      setLocalUserColumnOverlay(null);
      migratedLocalColumnPrefs.current = false;
      return;
    }
    if (!columnPrefsLoaded) return;

    const scopedUserId = String(userId);
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      saveModuleColumnPreferenceList("contacts", scopedUserId, serverColumnPrefs);
      return;
    }

    const local = loadModuleColumnPreferences("contacts", scopedUserId);
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
      saveColumnPrefs(preferences);
    },
    [saveColumnPrefs, userId],
  );

  return {
    rawUserColumnOverlay,
    updateUserColumnLayout,
  };
}
