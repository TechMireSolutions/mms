import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_HASANAT_SETTINGS,
  HASANAT_MODULE_CONTRACT,
  type HasanatSettings,
} from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";

function mergeHasanatSettings(settings: Partial<HasanatSettings> | null | undefined): HasanatSettings {
  return {
    ...DEFAULT_HASANAT_SETTINGS,
    ...(settings ?? {}),
    fields: {
      ...(DEFAULT_HASANAT_SETTINGS.fields ?? {}),
      ...(settings?.fields ?? {}),
    },
    customFields: settings?.customFields ?? DEFAULT_HASANAT_SETTINGS.customFields ?? [],
    fieldOrder: settings?.fieldOrder ?? DEFAULT_HASANAT_SETTINGS.fieldOrder ?? [],
  };
}

export function loadHasanatSettings(): HasanatSettings {
  return mergeHasanatSettings(
    getObject<Partial<HasanatSettings>>(
      HASANAT_MODULE_CONTRACT.settingsObjectKey,
      DEFAULT_HASANAT_SETTINGS
    ),
  );
}

export function useHasanatConfig() {
  const [settings, setSettings] = useState<HasanatSettings>(() => loadHasanatSettings());

  const reloadHasanatConfig = useCallback(() => {
    setSettings(loadHasanatSettings());
  }, []);

  useEffect(() => {
    reloadHasanatConfig();
  }, [reloadHasanatConfig]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadHasanatConfig);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadHasanatConfig]);

  const updateSettings = useCallback((next: HasanatSettings) => {
    const merged = mergeHasanatSettings(next);
    saveObject(HASANAT_MODULE_CONTRACT.settingsObjectKey, merged);
    setSettings(merged);
  }, []);

  return {
    settings,
    updateSettings,
  };
}
