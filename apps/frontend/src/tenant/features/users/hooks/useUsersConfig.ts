import {
  DEFAULT_USERS_SETTINGS,
  DEFAULT_USERS_FIELD_DEFS,
  USERS_MODULE_CONTRACT,
  mergeTabbedFields,
  type UsersSettings,
} from '@mms/shared';
import { getObject } from '@/lib/db';
import { useModuleConfig } from '@/hooks/useModuleConfig';

export function loadUsersSettings(): UsersSettings {
  const settings = getObject<Partial<UsersSettings>>(
    USERS_MODULE_CONTRACT.settingsObjectKey,
    DEFAULT_USERS_SETTINGS
  );
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

export function useUsersConfig() {
  const {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  } = useModuleConfig({
    settingsObjectKey: USERS_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_USERS_SETTINGS,
    defaultFieldDefs: DEFAULT_USERS_FIELD_DEFS,
  });

  return {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  };
}

