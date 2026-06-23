import type { HasanatSettings } from "@mms/shared";

export const HASANAT_CONFIG_COLLECTION_KEYS = {} as const;

export interface HasanatConfigDefaults {
  settings: HasanatSettings;
}
