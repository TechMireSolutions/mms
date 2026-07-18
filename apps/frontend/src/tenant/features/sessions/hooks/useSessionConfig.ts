import { useMemo } from "react";
import {
  DEFAULT_SESSIONS_SETTINGS,
  SESSIONS_MODULE_CONTRACT,
  DEFAULT_SESSIONS_FIELD_DEFS,
} from "@mms/shared";
import {
  SESSION_CONFIG_COLLECTION_KEYS,
  getSessionConfigCollectionDefaults,
} from "@/lib/sessionConfig/sessionConfigSeeds";
import { useModuleConfig } from "@/hooks/useModuleConfig";
import { useLiveCollection } from "@/hooks/useLiveCollection";

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

