import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_FINANCE_SETTINGS,
  DEFAULT_FINANCE_FIELD_DEFS,
  FINANCE_MODULE_CONTRACT,
  getSortedFields,
  mergeTabbedFields,
  getFlatFieldsConfig,
  type FinanceSettings,
} from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";

function mergeFinanceSettings(settings: Partial<FinanceSettings> | null | undefined): FinanceSettings {
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

export function loadFinanceSettings(): FinanceSettings {
  return mergeFinanceSettings(
    getObject<Partial<FinanceSettings>>(
      FINANCE_MODULE_CONTRACT.settingsObjectKey,
      DEFAULT_FINANCE_SETTINGS
    ),
  );
}

export function useFinanceConfig() {
  const [settings, setSettings] = useState<FinanceSettings>(() => loadFinanceSettings());

  const reloadFinanceConfig = useCallback(() => {
    setSettings(loadFinanceSettings());
  }, []);

  useEffect(() => {
    reloadFinanceConfig();
  }, [reloadFinanceConfig]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadFinanceConfig);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadFinanceConfig]);

  const updateSettings = useCallback((settingsDraft: FinanceSettings) => {
    const merged = mergeFinanceSettings(settingsDraft);
    saveObject(FINANCE_MODULE_CONTRACT.settingsObjectKey, merged);
    setSettings(merged);
  }, []);

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = settings.customFields ?? [];
  const fieldOrder = settings.fieldOrder ?? DEFAULT_FINANCE_SETTINGS.fieldOrder ?? [];

  const orderedFields = useMemo(
    () => getSortedFields(DEFAULT_FINANCE_FIELD_DEFS, fieldOrder, fields, customFields),
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
