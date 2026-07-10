import {
  DEFAULT_FINANCE_SETTINGS,
  DEFAULT_FINANCE_FIELD_DEFS,
  FINANCE_MODULE_CONTRACT,
  mergeTabbedFields,
  type FinanceSettings,
} from "@mms/shared";
import { getObject } from "@/lib/db";
import { useModuleConfig } from "@/hooks/useModuleConfig";

export function loadFinanceSettings(): FinanceSettings {
  const settings = getObject<Partial<FinanceSettings>>(
    FINANCE_MODULE_CONTRACT.settingsObjectKey,
    DEFAULT_FINANCE_SETTINGS
  );
  return {
    ...DEFAULT_FINANCE_SETTINGS,
    ...(settings ?? {}),
    formTabs: settings?.formTabs ?? DEFAULT_FINANCE_SETTINGS.formTabs ?? [],
    enabledTabs: settings?.enabledTabs ?? DEFAULT_FINANCE_SETTINGS.enabledTabs ?? [],
    requiredTabs: settings?.requiredTabs ?? DEFAULT_FINANCE_SETTINGS.requiredTabs ?? [],
    fields: mergeTabbedFields(
      DEFAULT_FINANCE_SETTINGS.fields || {},
      settings?.fields
    ),
    customFields: settings?.customFields ?? DEFAULT_FINANCE_SETTINGS.customFields ?? [],
    fieldOrder: settings?.fieldOrder ?? DEFAULT_FINANCE_SETTINGS.fieldOrder ?? [],
  };
}

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

