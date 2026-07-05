import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_USERS_SETTINGS,
  DEFAULT_USERS_FIELD_DEFS,
  USERS_MODULE_CONTRACT,
  getSortedFields,
  mergeTabbedFields,
  getFlatFieldsConfig,
  type UsersSettings,
} from '@mms/shared';
import { getObject, saveObject } from '@/lib/db';

function mergeUsersSettings(settings: Partial<UsersSettings> | null | undefined): UsersSettings {
  return {
    ...DEFAULT_USERS_SETTINGS,
    ...(settings ?? {}),
    formTabs: settings?.formTabs ?? DEFAULT_USERS_SETTINGS.formTabs ?? [],
    enabledTabs: settings?.enabledTabs ?? DEFAULT_USERS_SETTINGS.enabledTabs ?? [],
    requiredTabs: settings?.requiredTabs ?? DEFAULT_USERS_SETTINGS.requiredTabs ?? [],
    fields: mergeTabbedFields(
      DEFAULT_USERS_SETTINGS.fields || {},
      settings?.fields
    ),
    customFields: settings?.customFields ?? DEFAULT_USERS_SETTINGS.customFields ?? [],
    fieldOrder: settings?.fieldOrder ?? DEFAULT_USERS_SETTINGS.fieldOrder ?? [],
  };
}

export function loadUsersSettings(): UsersSettings {
  return mergeUsersSettings(
    getObject<Partial<UsersSettings>>(
      USERS_MODULE_CONTRACT.settingsObjectKey,
      DEFAULT_USERS_SETTINGS
    ),
  );
}

export function useUsersConfig() {
  const [settings, setSettings] = useState<UsersSettings>(() => loadUsersSettings());

  const reloadUsersConfig = useCallback(() => {
    setSettings(loadUsersSettings());
  }, []);

  useEffect(() => {
    reloadUsersConfig();
  }, [reloadUsersConfig]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadUsersConfig);
    };
    window.addEventListener('local-database-update', handleLocalDatabaseUpdate);
    return () => window.removeEventListener('local-database-update', handleLocalDatabaseUpdate);
  }, [reloadUsersConfig]);

  const updateSettings = useCallback((settingsDraft: UsersSettings) => {
    const merged = mergeUsersSettings(settingsDraft);
    saveObject(USERS_MODULE_CONTRACT.settingsObjectKey, merged);
    setSettings(merged);
  }, []);

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = useMemo(() => settings.customFields ?? [], [settings.customFields]);
  const fieldOrder = useMemo(() => settings.fieldOrder ?? DEFAULT_USERS_SETTINGS.fieldOrder ?? [], [settings.fieldOrder]);

  const orderedFields = useMemo(
    () => getSortedFields(DEFAULT_USERS_FIELD_DEFS, fieldOrder, fields, customFields),
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
