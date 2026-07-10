import {
  DEFAULT_ACCOUNTING_SETTINGS,
  DEFAULT_ACCOUNT_FIELD_DEFS,
  ACCOUNTING_MODULE_CONTRACT,
  mergeTabbedFields,
  type AccountingSettings,
} from "@mms/shared";
import { getObject } from "@/lib/db";
import { useModuleConfig } from "@/hooks/useModuleConfig";

export function loadAccountingSettings(): AccountingSettings {
  const settings = getObject<Partial<AccountingSettings>>(
    ACCOUNTING_MODULE_CONTRACT.settingsObjectKey,
    DEFAULT_ACCOUNTING_SETTINGS
  );
  return {
    ...DEFAULT_ACCOUNTING_SETTINGS,
    ...(settings ?? {}),
    formTabs: settings?.formTabs ?? DEFAULT_ACCOUNTING_SETTINGS.formTabs ?? [],
    enabledTabs: settings?.enabledTabs ?? DEFAULT_ACCOUNTING_SETTINGS.enabledTabs ?? [],
    requiredTabs: settings?.requiredTabs ?? DEFAULT_ACCOUNTING_SETTINGS.requiredTabs ?? [],
    fields: mergeTabbedFields(
      DEFAULT_ACCOUNTING_SETTINGS.fields || {},
      settings?.fields
    ),
    customFields: settings?.customFields ?? DEFAULT_ACCOUNTING_SETTINGS.customFields ?? [],
    fieldOrder: settings?.fieldOrder ?? DEFAULT_ACCOUNTING_SETTINGS.fieldOrder ?? [],
  };
}

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

