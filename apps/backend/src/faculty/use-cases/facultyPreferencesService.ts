import {
  normalizeTeacherModulePreferences,
  type TeacherModulePreferences,
} from '@mms/shared';
import {
  getTeacherModulePreferencesByWorkspace,
  upsertTeacherModulePreferences,
} from '../../db/repositories/facultyModulePreferencesRepository.js';
import { createModulePreferencesService } from '../../lib/createModulePreferencesService.js';

const service = createModulePreferencesService<TeacherModulePreferences>({
  broadcastKey: 'teachers',
  getByWorkspace: getTeacherModulePreferencesByWorkspace,
  upsert: upsertTeacherModulePreferences,
  normalize: normalizeTeacherModulePreferences,
});

export const loadFacultyModulePreferences = service.load;
export const loadTeacherModulePreferences = loadFacultyModulePreferences;

export const saveFacultyModulePreferences = service.save;
export const saveTeacherModulePreferences = saveFacultyModulePreferences;
