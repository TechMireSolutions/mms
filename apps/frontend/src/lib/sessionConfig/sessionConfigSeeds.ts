import type { SessionsSettings } from "@mms/shared";

export const SESSION_CONFIG_COLLECTION_KEYS = {
  statuses: "sessionStatuses",
  types: "sessionTypes",
} as const;

export interface SessionConfigDefaults {
  statuses: string[];
  types: string[];
  settings: SessionsSettings;
}

export function getSessionConfigCollectionDefaults(): Pick<SessionConfigDefaults, "statuses" | "types"> {
  return {
    statuses: [],
    types: [],
  };
}
