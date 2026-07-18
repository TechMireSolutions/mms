import {
  DEFAULT_ACCOUNTING_SETTINGS,
  DEFAULT_ACCOUNT_FIELD_DEFS,
  ACCOUNTING_MODULE_CONTRACT,
} from "@mms/shared";
import { useModuleConfig } from "@/hooks/useModuleConfig";

export function useAccountingConfig() {
  return useModuleConfig({
    settingsObjectKey: ACCOUNTING_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_ACCOUNTING_SETTINGS,
    defaultFieldDefs: DEFAULT_ACCOUNT_FIELD_DEFS,
  });
}

