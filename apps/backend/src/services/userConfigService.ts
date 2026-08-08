import {
  composeUsersSettings,
  mergeUsersFormTabsFromApi,
  stripUserFieldConfigForPersist,
  type FieldDefinition,
  type UsersSettings,
  type TabDefinition,
} from '@mms/shared';
import {
  createModuleFieldConfigService,
  mapCustomTabRowToFormTabFields,
  requireFieldConfigTenant,
} from '../lib/createModuleFieldConfigService.js';
import {
  getUserFieldConfigByWorkspace,
  upsertUserFieldConfig,
} from '../db/repositories/userFieldConfigRepository.js';
import { getUserModulePreferencesByWorkspace } from '../db/repositories/userModulePreferencesRepository.js';
import { mergeFormTabsFromCustomTabs } from './mergeFormTabsFromCustomTabs.js';

const userFieldConfig = createModuleFieldConfigService<
  Record<string, unknown>,
  UsersSettings,
  TabDefinition,
  Record<string, FieldDefinition[]> | undefined,
  ReturnType<typeof stripUserFieldConfigForPersist>
>({
  moduleId: 'users',
  broadcastKey: 'users',
  getByWorkspace: getUserFieldConfigByWorkspace,
  upsert: upsertUserFieldConfig,
  mapRow: mapCustomTabRowToFormTabFields,
  merge: mergeUsersFormTabsFromApi,
  toDocument: async (raw, tenant) => {
    const prefs = await getUserModulePreferencesByWorkspace(tenant);
    return composeUsersSettings(raw, prefs);
  },
  stripForPersist: stripUserFieldConfigForPersist,
  reloadFailedMessage: 'Failed to reload user field config after save',
});

export const loadUserFieldConfig = userFieldConfig.load;

export async function saveUserFieldConfig(
  config: UsersSettings | Record<string, unknown>,
): Promise<UsersSettings> {
  return userFieldConfig.save(config as UsersSettings);
}

/** Full UsersSettings for validation (field-config + preferences + tabs). */
export async function loadUsersSettingsCombined(): Promise<UsersSettings> {
  const tenant = requireFieldConfigTenant();
  const field = await getUserFieldConfigByWorkspace(tenant);
  const prefs = await getUserModulePreferencesByWorkspace(tenant);
  const composed = composeUsersSettings(field, prefs);
  const formTabs = await mergeFormTabsFromCustomTabs({
    moduleId: 'users',
    documentFormTabs: composed.formTabs,
    fields: composed.fields as Record<string, FieldDefinition[]> | undefined,
    mapRow: mapCustomTabRowToFormTabFields,
    merge: mergeUsersFormTabsFromApi,
  });
  return { ...composed, formTabs };
}
