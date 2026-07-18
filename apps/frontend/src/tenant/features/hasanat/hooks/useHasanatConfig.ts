import {
  DEFAULT_HASANAT_SETTINGS,
  HASANAT_MODULE_CONTRACT,
  DEFAULT_HASANAT_FIELD_DEFS,
} from "@mms/shared";
import { useModuleConfig } from "@/hooks/useModuleConfig";

export function useHasanatConfig() {
  return useModuleConfig({
    settingsObjectKey: HASANAT_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_HASANAT_SETTINGS,
    defaultFieldDefs: DEFAULT_HASANAT_FIELD_DEFS,
  });
}

