import {
  DEFAULT_ACCOUNTING_SETTINGS,
  DEFAULT_ACCOUNT_FIELD_DEFS,
  ACCOUNTING_MODULE_CONTRACT,
} from "@mms/shared";
import { useModuleConfig } from "@/hooks/useModuleConfig";

export function useAccountingConfig() {
  const {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  } = useModuleConfig({
    settingsObjectKey: ACCOUNTING_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_ACCOUNTING_SETTINGS,
    defaultFieldDefs: DEFAULT_ACCOUNT_FIELD_DEFS,
  });

  return {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  };
}

