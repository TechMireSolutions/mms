import {
  normalizeTeacherModulePreferences,
  type TeacherModulePreferences,
} from '@mms/shared';
import {
  getTeacherModulePreferencesByWorkspace,
  upsertTeacherModulePreferences,
} from '../../db/repositories/teacherModulePreferencesRepository.js';
import { createModulePreferencesService } from '../../lib/createModulePreferencesService.js';

const service = createModulePreferencesService<TeacherModulePreferences>({
  broadcastKey: 'teachers',
  getByWorkspace: getTeacherModulePreferencesByWorkspace,
  upsert: upsertTeacherModulePreferences,
  normalize: normalizeTeacherModulePreferences,
});

export const loadTeacherModulePreferences = service.load;
export const saveTeacherModulePreferences = service.save;
