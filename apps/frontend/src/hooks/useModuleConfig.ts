import { useCallback, useMemo } from "react";
import {
  getSortedFields,
  mergeTabbedFields,
  getFlatFieldsConfig,
  type ModuleFieldDef,
} from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";
import { useLiveObject } from "@/hooks/useLiveObject";

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
  normalizeFn?: (settings: any) => T;
}

export function useModuleConfig<T extends ModuleSettingsShape>({
  settingsObjectKey,
  defaultSettings,
  defaultFieldDefs,
  normalizeFn,
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
    const raw = getObject<Partial<T>>(
      settingsObjectKey,
      defaultSettings
    );
    if (normalizeFn) {
      return normalizeFn(raw);
    }
    return mergeSettings(raw);
  }, [settingsObjectKey, defaultSettings, mergeSettings, normalizeFn]);

  const settings = useLiveObject<T>(
    settingsObjectKey,
    defaultSettings,
    { loadFn: () => loadSettings() },
  );

  const reloadConfig = useCallback(() => {}, []);

  const updateSettings = useCallback((settingsDraft: T) => {
    const merged = normalizeFn ? normalizeFn(settingsDraft) : mergeSettings(settingsDraft);
    saveObject(settingsObjectKey, merged);
  }, [settingsObjectKey, mergeSettings, normalizeFn]);

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = useMemo(() => settings.customFields ?? [], [settings.customFields]);
  const fieldOrder = useMemo(() => settings.fieldOrder ?? defaultSettings.fieldOrder ?? [], [settings.fieldOrder, defaultSettings.fieldOrder]);

  const orderedFields = useMemo(
    () => getSortedFields(defaultFieldDefs, fieldOrder, fields, customFields),
    [defaultFieldDefs, fieldOrder, fields, customFields],
  );

  const isFieldEnabled = useCallback(
    (fieldId: string): boolean => fields[fieldId]?.enabled !== false,
    [fields],
  );

  const isFieldRequired = useCallback(
    (fieldId: string): boolean => !!fields[fieldId]?.required,
    [fields],
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
    isFieldEnabled,
    isFieldRequired,
  };
}
