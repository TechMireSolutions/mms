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
} from '../../db/repositories/teacherFieldConfigRepository.js';
import { getTeacherModulePreferencesByWorkspace } from '../../db/repositories/teacherModulePreferencesRepository.js';

const teacherFieldConfig = createModuleFieldConfigService<
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
  reloadFailedMessage: 'Failed to reload teacher field config after save',
});

export const loadTeacherFieldConfig = teacherFieldConfig.load;

export async function saveTeacherFieldConfig(
  config: TeachersSettings | Record<string, unknown>,
): Promise<TeachersSettings> {
  return teacherFieldConfig.save(config as TeachersSettings);
}

/** Full TeachersSettings for validation / employee ID (field-config + preferences + tabs). */
export async function loadTeachersSettingsCombined(): Promise<TeachersSettings> {
  const tenant = requireFieldConfigTenant();
  const field = await getTeacherFieldConfigByWorkspace(tenant);
  const prefs = await getTeacherModulePreferencesByWorkspace(tenant);
  return composeTeachersSettings(field, prefs);
}
