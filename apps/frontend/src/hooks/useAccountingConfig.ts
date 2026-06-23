import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ACCOUNTING_SETTINGS,
  DEFAULT_ACCOUNT_FIELD_DEFS,
  ACCOUNTING_MODULE_CONTRACT,
  getSortedFields,
  type AccountingSettings,
} from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";

function mergeAccountingSettings(settings: Partial<AccountingSettings> | null | undefined): AccountingSettings {
  return {
    ...DEFAULT_ACCOUNTING_SETTINGS,
    ...(settings ?? {}),
    fields: {
      ...(DEFAULT_ACCOUNTING_SETTINGS.fields ?? {}),
      ...(settings?.fields ?? {}),
    },
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

  const updateSettings = useCallback((next: AccountingSettings) => {
    const merged = mergeAccountingSettings(next);
    saveObject(ACCOUNTING_MODULE_CONTRACT.settingsObjectKey, merged);
    setSettings(merged);
  }, []);

  const fields = settings.fields ?? DEFAULT_ACCOUNTING_SETTINGS.fields ?? {};
  const customFields = settings.customFields ?? [];
  const fieldOrder = settings.fieldOrder ?? DEFAULT_ACCOUNTING_SETTINGS.fieldOrder ?? [];

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
