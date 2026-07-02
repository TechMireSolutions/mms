import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SESSIONS_SETTINGS,
  SESSIONS_MODULE_CONTRACT,
  DEFAULT_SESSIONS_FIELD_DEFS,
  getSortedFields,
  mergeTabbedFields,
  getFlatFieldsConfig,
  type SessionsSettings,
} from "@mms/shared";
import { getCollection, getObject, saveObject } from "@/lib/db";
import {
  SESSION_CONFIG_COLLECTION_KEYS,
  getSessionConfigCollectionDefaults,
} from "@/lib/sessionConfig/sessionConfigSeeds";

function mergeSessionSettings(settings: Partial<SessionsSettings> | null | undefined): SessionsSettings {
  return {
    ...DEFAULT_SESSIONS_SETTINGS,
    ...(settings ?? {}),
    formTabs: settings?.formTabs ?? DEFAULT_SESSIONS_SETTINGS.formTabs ?? [],
    enabledTabs: settings?.enabledTabs ?? DEFAULT_SESSIONS_SETTINGS.enabledTabs ?? [],
    requiredTabs: settings?.requiredTabs ?? DEFAULT_SESSIONS_SETTINGS.requiredTabs ?? [],
    fields: mergeTabbedFields(
      DEFAULT_SESSIONS_SETTINGS.fields || {},
      settings?.fields
    ),
    customFields: settings?.customFields ?? DEFAULT_SESSIONS_SETTINGS.customFields ?? [],
    fieldOrder: settings?.fieldOrder ?? DEFAULT_SESSIONS_SETTINGS.fieldOrder ?? [],
  };
}

export function loadSessionSettings(): SessionsSettings {
  return mergeSessionSettings(
    getObject<Partial<SessionsSettings>>(SESSIONS_MODULE_CONTRACT.settingsObjectKey, DEFAULT_SESSIONS_SETTINGS),
  );
}

export function useSessionConfig() {
  const defaults = useMemo(() => getSessionConfigCollectionDefaults(), []);
  const [settings, setSettings] = useState<SessionsSettings>(() => loadSessionSettings());
  const [statuses, setStatuses] = useState<string[]>(() =>
    getCollection(SESSION_CONFIG_COLLECTION_KEYS.statuses, defaults.statuses),
  );
  const [types, setTypes] = useState<string[]>(() =>
    getCollection(SESSION_CONFIG_COLLECTION_KEYS.types, defaults.types),
  );

  const reloadSessionConfig = useCallback(() => {
    setSettings(loadSessionSettings());
    setStatuses(getCollection(SESSION_CONFIG_COLLECTION_KEYS.statuses, defaults.statuses));
    setTypes(getCollection(SESSION_CONFIG_COLLECTION_KEYS.types, defaults.types));
  }, [defaults]);

  useEffect(() => {
    reloadSessionConfig();
  }, [reloadSessionConfig]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadSessionConfig);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadSessionConfig]);

  const updateSettings = useCallback((settingsDraft: SessionsSettings) => {
    const merged = mergeSessionSettings(settingsDraft);
    saveObject(SESSIONS_MODULE_CONTRACT.settingsObjectKey, merged);
    setSettings(merged);
  }, []);

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = settings.customFields ?? [];
  const fieldOrder = settings.fieldOrder ?? DEFAULT_SESSIONS_SETTINGS.fieldOrder ?? [];

  const orderedFields = useMemo(() => {
    return getSortedFields(DEFAULT_SESSIONS_FIELD_DEFS, fieldOrder, fields, customFields);
  }, [fieldOrder, fields, customFields]);

  return {
    settings,
    statuses,
    types,
    fields,
    customFields,
    orderedFields,
    updateSettings,
  };
}
