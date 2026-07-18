import { useMemo } from "react";
import {
  DEFAULT_SESSIONS_SETTINGS,
  SESSIONS_MODULE_CONTRACT,
  DEFAULT_SESSIONS_FIELD_DEFS,
  mergeTabbedFields,
  type SessionsSettings,
} from "@mms/shared";
import { getObject } from "@/lib/db";
import {
  SESSION_CONFIG_COLLECTION_KEYS,
  getSessionConfigCollectionDefaults,
} from "@/lib/sessionConfig/sessionConfigSeeds";
import { useModuleConfig } from "@/hooks/useModuleConfig";
import { useLiveCollection } from "@/hooks/useLiveCollection";

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
  } = useModuleConfig({
    settingsObjectKey: SESSIONS_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_SESSIONS_SETTINGS,
    defaultFieldDefs: DEFAULT_SESSIONS_FIELD_DEFS,
  });

  const statuses = useLiveCollection<string>(
    SESSION_CONFIG_COLLECTION_KEYS.statuses,
    defaults.statuses,
  );
  const types = useLiveCollection<string>(
    SESSION_CONFIG_COLLECTION_KEYS.types,
    defaults.types,
  );

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

