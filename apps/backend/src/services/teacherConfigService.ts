import {
  composeTeachersSettings,
  mergeTeachersFormTabsFromApi,
  stripTeacherFieldConfigForPersist,
  type FieldDefinition,
  type TeachersSettings,
  type TabDefinition,
} from '@mms/shared';
import {
  createModuleFieldConfigService,
  mapCustomTabRowToFormTabFields,
  requireFieldConfigTenant,
} from '../lib/createModuleFieldConfigService.js';
import {
  getTeacherFieldConfigByWorkspace,
  upsertTeacherFieldConfig,
} from '../db/repositories/teacherFieldConfigRepository.js';
import { getTeacherModulePreferencesByWorkspace } from '../db/repositories/teacherModulePreferencesRepository.js';
import { mergeFormTabsFromCustomTabs } from './mergeFormTabsFromCustomTabs.js';

const teacherFieldConfig = createModuleFieldConfigService<
  Record<string, unknown>,
  TeachersSettings,
  TabDefinition,
  Record<string, FieldDefinition[]> | undefined,
  ReturnType<typeof stripTeacherFieldConfigForPersist>
>({
  moduleId: 'teachers',
  broadcastKey: 'teachers',
  getByWorkspace: getTeacherFieldConfigByWorkspace,
  upsert: upsertTeacherFieldConfig,
  mapRow: mapCustomTabRowToFormTabFields,
  merge: mergeTeachersFormTabsFromApi,
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
  const composed = composeTeachersSettings(field, prefs);
  const formTabs = await mergeFormTabsFromCustomTabs({
    moduleId: 'teachers',
    documentFormTabs: composed.formTabs,
    fields: composed.fields as Record<string, FieldDefinition[]> | undefined,
    mapRow: mapCustomTabRowToFormTabFields,
    merge: mergeTeachersFormTabsFromApi,
  });
  return { ...composed, formTabs };
}
