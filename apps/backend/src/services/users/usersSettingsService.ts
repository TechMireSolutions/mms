import { getObject } from '../../db/database.js';
import { DEFAULT_USERS_SETTINGS, type UsersSettings } from '@mms/shared';

const USERS_SETTINGS_KEY = 'users_settings';

/** Loads tenant users module settings (registration / verification policy). */
export async function getTenantUsersSettings(): Promise<UsersSettings> {
  const raw = await getObject(USERS_SETTINGS_KEY);
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_USERS_SETTINGS;
  }
  return { ...DEFAULT_USERS_SETTINGS, ...(raw as UsersSettings) };
}
