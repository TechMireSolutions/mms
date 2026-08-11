import {
  normalizeUserModulePreferences,
  type UserModulePreferences,
} from '@mms/shared';
import {
  getUserModulePreferencesByWorkspace,
  upsertUserModulePreferences,
} from '../db/repositories/userModulePreferencesRepository.js';
import { createModulePreferencesService } from './createModulePreferencesService.js';

const service = createModulePreferencesService<UserModulePreferences>({
  broadcastKey: 'users',
  getByWorkspace: getUserModulePreferencesByWorkspace,
  upsert: upsertUserModulePreferences,
  normalize: normalizeUserModulePreferences,
});

export const loadUserModulePreferences = service.load;
export const saveUserModulePreferences = service.save;
