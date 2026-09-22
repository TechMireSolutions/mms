import {
  normalizeTeacherModulePreferences,
  type TeacherModulePreferences,
} from '@mms/shared';
import {
  getTeacherModulePreferencesByWorkspace,
  upsertTeacherModulePreferences,
} from '../../db/repositories/facultyModulePreferencesRepository.js';
import { createModulePreferencesService } from '../../lib/createModulePreferencesService.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import {
  getFacultySetupConfig,
  updateFacultySetupConfig,
} from './facultyEmployeeIdService.js';

const service = createModulePreferencesService<TeacherModulePreferences>({
  broadcastKey: 'teachers',
  getByWorkspace: getTeacherModulePreferencesByWorkspace,
  upsert: upsertTeacherModulePreferences,
  normalize: normalizeTeacherModulePreferences,
});

export const loadFacultyModulePreferences = async () => {
  const prefs = await service.load();
  const tenant = getRequestTenant();
  if (tenant) {
    try {
      const config = await getFacultySetupConfig(tenant);
      return {
        ...prefs,
        employeeIdPrefix: config.prefix,
        employeeIdYearFormat: config.yearFormat as 'YYYY' | 'YY' | 'NONE',
        employeeIdSequenceDigits: config.sequenceDigits,
        employeeIdDelimiter: config.delimiter,
        employeeIdLastYear: config.lastYear,
        employeeIdCurrentSequence: config.currentSequence,
      };
    } catch {
      return prefs;
    }
  }
  return prefs;
};
export const loadTeacherModulePreferences = loadFacultyModulePreferences;

export const saveFacultyModulePreferences = async (preferences: TeacherModulePreferences) => {
  const result = await service.save(preferences);
  const tenant = getRequestTenant();
  if (tenant) {
    try {
      await updateFacultySetupConfig(tenant, preferences);
    } catch {
      // Best-effort sync to dedicated sequence table
    }
  }
  return result;
};
export const saveTeacherModulePreferences = saveFacultyModulePreferences;

