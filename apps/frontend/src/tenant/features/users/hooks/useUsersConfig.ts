import {
  DEFAULT_USERS_SETTINGS,
  DEFAULT_USERS_FIELD_DEFS,
  USERS_MODULE_CONTRACT,
} from '@mms/shared';
import { useModuleConfig } from '@/hooks/useModuleConfig';

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


