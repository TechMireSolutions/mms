import { useMemo } from "react";
import {
  SESSION_CONFIG_COLLECTION_KEYS,
  getSessionConfigCollectionDefaults,
} from "@/lib/sessionConfig/sessionConfigSeeds";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useStandardModuleConfig } from "@/hooks/useStandardModuleConfig";

export function useSessionConfig() {
  const defaults = useMemo(() => getSessionConfigCollectionDefaults(), []);
  
  const config = useStandardModuleConfig("sessions");

  const statuses = useLiveCollection<string>(
    SESSION_CONFIG_COLLECTION_KEYS.statuses,
    defaults.statuses,
  );
  const types = useLiveCollection<string>(
    SESSION_CONFIG_COLLECTION_KEYS.types,
    defaults.types,
  );

  return {
    ...config,
    statuses,
    types,
  };
}


