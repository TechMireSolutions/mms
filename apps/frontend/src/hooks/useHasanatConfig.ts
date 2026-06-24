import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_HASANAT_SETTINGS,
  HASANAT_MODULE_CONTRACT,
  DEFAULT_HASANAT_FIELD_DEFS,
  getSortedFields,
  mergeTabbedFields,
  getFlatFieldsConfig,
  type HasanatSettings,
} from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";

function mergeHasanatSettings(settings: Partial<HasanatSettings> | null | undefined): HasanatSettings {
  return {
    ...DEFAULT_HASANAT_SETTINGS,
    ...(settings ?? {}),
    formTabs: settings?.formTabs ?? DEFAULT_HASANAT_SETTINGS.formTabs ?? [],
    enabledTabs: settings?.enabledTabs ?? DEFAULT_HASANAT_SETTINGS.enabledTabs ?? [],
    requiredTabs: settings?.requiredTabs ?? DEFAULT_HASANAT_SETTINGS.requiredTabs ?? [],
    fields: mergeTabbedFields(
      DEFAULT_HASANAT_SETTINGS.fields || {},
      settings?.fields
    ),
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

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = settings.customFields ?? [];
  const fieldOrder = settings.fieldOrder ?? DEFAULT_HASANAT_SETTINGS.fieldOrder ?? [];

  const orderedFields = useMemo(
    () => getSortedFields(DEFAULT_HASANAT_FIELD_DEFS, fieldOrder, fields, customFields),
    [fieldOrder, fields, customFields],
  );

  return {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  };
}

