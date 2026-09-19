import {
  composeTeachersSettings,
  stripTeacherFieldConfigForPersist,
  type FieldDefinition,
  type TeachersSettings,
  type TabDefinition,
} from '@mms/shared';
import {
  createModuleFieldConfigService,
  requireFieldConfigTenant,
} from '../../lib/createModuleFieldConfigService.js';
import {
  getTeacherFieldConfigByWorkspace,
  upsertTeacherFieldConfig,
} from '../../db/repositories/facultyFieldConfigRepository.js';
import { getTeacherModulePreferencesByWorkspace } from '../../db/repositories/facultyModulePreferencesRepository.js';

const facultyFieldConfig = createModuleFieldConfigService<
  Record<string, unknown>,
  TeachersSettings,
  TabDefinition,
  Record<string, FieldDefinition[]> | undefined,
  ReturnType<typeof stripTeacherFieldConfigForPersist>
>({
  broadcastKey: 'teachers',
  getByWorkspace: getTeacherFieldConfigByWorkspace,
  upsert: upsertTeacherFieldConfig,
  toDocument: async (raw, tenant) => {
    const prefs = await getTeacherModulePreferencesByWorkspace(tenant);
    return composeTeachersSettings(raw, prefs);
  },
  stripForPersist: stripTeacherFieldConfigForPersist,
  reloadFailedMessage: 'Failed to reload faculty field config after save',
});

export const loadFacultyFieldConfig = facultyFieldConfig.load;
export const loadTeacherFieldConfig = loadFacultyFieldConfig;

export async function saveFacultyFieldConfig(
  config: TeachersSettings | Record<string, unknown>,
): Promise<TeachersSettings> {
  return facultyFieldConfig.save(config as TeachersSettings);
}
export const saveTeacherFieldConfig = saveFacultyFieldConfig;

/** Full TeachersSettings for validation / employee ID (field-config + preferences + tabs). */
export async function loadFacultySettingsCombined(): Promise<TeachersSettings> {
  const tenant = requireFieldConfigTenant();
  const field = await getTeacherFieldConfigByWorkspace(tenant);
  const prefs = await getTeacherModulePreferencesByWorkspace(tenant);
  return composeTeachersSettings(field, prefs);
}
export const loadTeachersSettingsCombined = loadFacultySettingsCombined;
