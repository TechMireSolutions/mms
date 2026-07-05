import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ACCOUNTING_SETTINGS,
  DEFAULT_ACCOUNT_FIELD_DEFS,
  ACCOUNTING_MODULE_CONTRACT,
  getSortedFields,
  mergeTabbedFields,
  getFlatFieldsConfig,
  type AccountingSettings,
} from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";

function mergeAccountingSettings(settings: Partial<AccountingSettings> | null | undefined): AccountingSettings {
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

export function loadAccountingSettings(): AccountingSettings {
  return mergeAccountingSettings(
    getObject<Partial<AccountingSettings>>(
      ACCOUNTING_MODULE_CONTRACT.settingsObjectKey,
      DEFAULT_ACCOUNTING_SETTINGS
    ),
  );
}

export function useAccountingConfig() {
  const [settings, setSettings] = useState<AccountingSettings>(() => loadAccountingSettings());

  const reloadAccountingConfig = useCallback(() => {
    setSettings(loadAccountingSettings());
  }, []);

  useEffect(() => {
    reloadAccountingConfig();
  }, [reloadAccountingConfig]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadAccountingConfig);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadAccountingConfig]);

  const updateSettings = useCallback((settingsDraft: AccountingSettings) => {
    const merged = mergeAccountingSettings(settingsDraft);
    saveObject(ACCOUNTING_MODULE_CONTRACT.settingsObjectKey, merged);
    setSettings(merged);
  }, []);

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = useMemo(() => settings.customFields ?? [], [settings.customFields]);
  const fieldOrder = useMemo(() => settings.fieldOrder ?? DEFAULT_ACCOUNTING_SETTINGS.fieldOrder ?? [], [settings.fieldOrder]);

  const orderedFields = useMemo(
    () => getSortedFields(DEFAULT_ACCOUNT_FIELD_DEFS, fieldOrder, fields, customFields),
    [fieldOrder, fields, customFields],
  );

  return {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  };
}
