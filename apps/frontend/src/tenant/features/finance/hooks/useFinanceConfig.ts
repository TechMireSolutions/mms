import {
  DEFAULT_FINANCE_SETTINGS,
  DEFAULT_FINANCE_FIELD_DEFS,
  FINANCE_MODULE_CONTRACT,
} from "@mms/shared";
import { useModuleConfig } from "@/hooks/useModuleConfig";

export function useFinanceConfig() {
  const {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  } = useModuleConfig({
    settingsObjectKey: FINANCE_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_FINANCE_SETTINGS,
    defaultFieldDefs: DEFAULT_FINANCE_FIELD_DEFS,
  });

  return {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  };
}

