import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SESSIONS_SETTINGS,
  SESSIONS_MODULE_CONTRACT,
  DEFAULT_SESSIONS_FIELD_DEFS,
  mergeTabbedFields,
  type SessionsSettings,
} from "@mms/shared";
import { getCollection, getObject } from "@/lib/db";
import {
  SESSION_CONFIG_COLLECTION_KEYS,
  getSessionConfigCollectionDefaults,
} from "@/lib/sessionConfig/sessionConfigSeeds";
import { useModuleConfig } from "@/hooks/useModuleConfig";

export function loadSessionSettings(): SessionsSettings {
  const settings = getObject<Partial<SessionsSettings>>(
    SESSIONS_MODULE_CONTRACT.settingsObjectKey,
    DEFAULT_SESSIONS_SETTINGS
  );
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

export function useSessionConfig() {
  const defaults = useMemo(() => getSessionConfigCollectionDefaults(), []);
  
  const {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
    reloadConfig,
  } = useModuleConfig({
    settingsObjectKey: SESSIONS_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_SESSIONS_SETTINGS,
    defaultFieldDefs: DEFAULT_SESSIONS_FIELD_DEFS,
  });

  const [statuses, setStatuses] = useState<string[]>(() =>
    getCollection(SESSION_CONFIG_COLLECTION_KEYS.statuses, defaults.statuses),
  );
  const [types, setTypes] = useState<string[]>(() =>
    getCollection(SESSION_CONFIG_COLLECTION_KEYS.types, defaults.types),
  );

  const reloadCollections = useCallback(() => {
    reloadConfig();
    setStatuses(getCollection(SESSION_CONFIG_COLLECTION_KEYS.statuses, defaults.statuses));
    setTypes(getCollection(SESSION_CONFIG_COLLECTION_KEYS.types, defaults.types));
  }, [defaults, reloadConfig]);

  useEffect(() => {
    reloadCollections();
  }, [reloadCollections]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadCollections);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadCollections]);

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

