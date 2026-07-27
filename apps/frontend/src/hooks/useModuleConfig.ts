import { useCallback, useMemo } from "react";
import {
  getSortedFields,
  mergeTabbedFields,
  getFlatFieldsConfig,
  type ModuleFieldDef,
  type ModuleCustomField,
  type TabDefinition,
} from "@mms/shared";

import { getObject, saveObject, saveObjectAsync } from "@/lib/db";
import { useLiveObject } from "@/hooks/useLiveObject";

export interface ModuleSettingsShape {
  fields?: Record<string, any>;
  customFields?: ModuleCustomField[] | any[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[] | any[];
  enabledTabs?: string[];
  requiredTabs?: string[];
  [key: string]: any;
}

export interface UseModuleConfigOptions<T extends ModuleSettingsShape> {
  settingsObjectKey: string;
  defaultSettings: T;
  defaultFieldDefs: ModuleFieldDef[];
  normalizeFn?: (settings: unknown) => T;
}


/**
 * Authoritative hook for managing module dynamic field configurations, settings persistence, and field ordering.
 */
export function useModuleConfig<T extends ModuleSettingsShape>({
  settingsObjectKey,
  defaultSettings,
  defaultFieldDefs,
  normalizeFn,
}: UseModuleConfigOptions<T>) {
  const mergeSettings = useCallback(
    (settingsDraft: Partial<T> | null | undefined): T => {
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
    },
    [defaultSettings]
  );

  const resolveSettings = useCallback(
    (raw: Partial<T> | null | undefined): T => {
      return normalizeFn ? normalizeFn(raw) : mergeSettings(raw);
    },
    [normalizeFn, mergeSettings]
  );

  const loadSettings = useCallback((): T => {
    const raw = getObject<Partial<T>>(settingsObjectKey, defaultSettings);
    return resolveSettings(raw);
  }, [settingsObjectKey, defaultSettings, resolveSettings]);

  const settings = useLiveObject<T>(
    settingsObjectKey,
    defaultSettings,
    { loadFn: loadSettings },
  );

  const reloadConfig = useCallback(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(
    (settingsDraft: T) => {
      const merged = resolveSettings(settingsDraft);
      saveObject(settingsObjectKey, merged);
    },
    [settingsObjectKey, resolveSettings]
  );

  const updateSettingsAsync = useCallback(
    async (settingsDraft: T) => {
      const merged = resolveSettings(settingsDraft);
      const result = await saveObjectAsync(settingsObjectKey, merged);
      if (!result.ok) {
        throw new Error(`Failed to sync settings for ${settingsObjectKey}`);
      }
    },
    [settingsObjectKey, resolveSettings]
  );

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = useMemo(() => (settings.customFields || []) as ModuleCustomField[], [settings.customFields]);
  const fieldOrder = useMemo(
    () => settings.fieldOrder ?? defaultSettings.fieldOrder ?? [],
    [settings.fieldOrder, defaultSettings.fieldOrder]
  );

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
    updateSettingsAsync,
    reloadConfig,
    mergeSettings,
    loadSettings,
    isFieldEnabled,
    isFieldRequired,
  };
}
