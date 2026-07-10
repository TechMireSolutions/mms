import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSortedFields,
  mergeTabbedFields,
  getFlatFieldsConfig,
  type ModuleFieldDef,
} from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";

export interface ModuleSettingsShape {
  fields?: Record<string, any>;
  customFields?: any[];
  fieldOrder?: string[];
  formTabs?: any[];
  enabledTabs?: string[];
  requiredTabs?: string[];
  [key: string]: any; // Allow other settings properties
}

export interface UseModuleConfigOptions<T extends ModuleSettingsShape> {
  settingsObjectKey: string;
  defaultSettings: T;
  defaultFieldDefs: ModuleFieldDef[];
}

export function useModuleConfig<T extends ModuleSettingsShape>({
  settingsObjectKey,
  defaultSettings,
  defaultFieldDefs,
}: UseModuleConfigOptions<T>) {
  const mergeSettings = useCallback((settingsDraft: Partial<T> | null | undefined): T => {
    return {
      ...defaultSettings,
      ...(settingsDraft ?? {}),
      formTabs: settingsDraft?.formTabs ?? defaultSettings.formTabs ?? [],
      enabledTabs: settingsDraft?.enabledTabs ?? defaultSettings.enabledTabs ?? [],
      requiredTabs: settingsDraft?.requiredTabs ?? defaultSettings.requiredTabs ?? [],
      fields: mergeTabbedFields(
        defaultSettings.fields || {},
        settingsDraft?.fields
      ),
      customFields: settingsDraft?.customFields ?? defaultSettings.customFields ?? [],
      fieldOrder: settingsDraft?.fieldOrder ?? defaultSettings.fieldOrder ?? [],
    } as T;
  }, [defaultSettings]);

  const loadSettings = useCallback((): T => {
    return mergeSettings(
      getObject<Partial<T>>(
        settingsObjectKey,
        defaultSettings
      ),
    );
  }, [settingsObjectKey, defaultSettings, mergeSettings]);

  const [settings, setSettings] = useState<T>(() => loadSettings());

  const reloadConfig = useCallback(() => {
    setSettings(loadSettings());
  }, [loadSettings]);

  useEffect(() => {
    reloadConfig();
  }, [reloadConfig]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadConfig);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadConfig]);

  const updateSettings = useCallback((settingsDraft: T) => {
    const merged = mergeSettings(settingsDraft);
    saveObject(settingsObjectKey, merged);
    setSettings(merged);
  }, [settingsObjectKey, mergeSettings]);

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = useMemo(() => settings.customFields ?? [], [settings.customFields]);
  const fieldOrder = useMemo(() => settings.fieldOrder ?? defaultSettings.fieldOrder ?? [], [settings.fieldOrder, defaultSettings.fieldOrder]);

  const orderedFields = useMemo(
    () => getSortedFields(defaultFieldDefs, fieldOrder, fields, customFields),
    [defaultFieldDefs, fieldOrder, fields, customFields],
  );

  return {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
    reloadConfig,
    mergeSettings,
    loadSettings,
  };
}
