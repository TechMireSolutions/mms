import {
  composeStudentsSettings,
  mergeStudentsFormTabsFromApi,
  stripStudentFieldConfigForPersist,
  type FieldDefinition,
  type StudentsSettings,
  type TabDefinition,
} from '@mms/shared';
import {
  createModuleFieldConfigService,
  mapCustomTabRowToFormTabFields,
  requireFieldConfigTenant,
} from '../lib/createModuleFieldConfigService.js';
import {
  getStudentFieldConfigByWorkspace,
  upsertStudentFieldConfig,
} from '../db/repositories/studentFieldConfigRepository.js';
import { getStudentModulePreferencesByWorkspace } from '../db/repositories/studentModulePreferencesRepository.js';
import { mergeFormTabsFromCustomTabs } from './mergeFormTabsFromCustomTabs.js';

const studentFieldConfig = createModuleFieldConfigService<
  Record<string, unknown>,
  StudentsSettings,
  TabDefinition,
  Record<string, FieldDefinition[]> | undefined,
  ReturnType<typeof stripStudentFieldConfigForPersist>
>({
  moduleId: 'students',
  broadcastKey: 'students',
  getByWorkspace: getStudentFieldConfigByWorkspace,
  upsert: upsertStudentFieldConfig,
  mapRow: mapCustomTabRowToFormTabFields,
  merge: mergeStudentsFormTabsFromApi,
  toDocument: async (raw, tenant) => {
    const prefs = await getStudentModulePreferencesByWorkspace(tenant);
    return composeStudentsSettings(raw, prefs);
  },
  stripForPersist: stripStudentFieldConfigForPersist,
  reloadFailedMessage: 'Failed to reload student field config after save',
});

/** Load typed field-config row (merged with custom_tabs for formTabs). */
export const loadStudentFieldConfig = studentFieldConfig.load;

export async function saveStudentFieldConfig(
  config: StudentsSettings | Record<string, unknown>,
): Promise<StudentsSettings> {
  return studentFieldConfig.save(config as StudentsSettings);
}

/** Full StudentsSettings for validation / GR (field-config + preferences + tabs). */
export async function loadStudentsSettingsCombined(): Promise<StudentsSettings> {
  const tenant = requireFieldConfigTenant();
  const field = await getStudentFieldConfigByWorkspace(tenant);
  const prefs = await getStudentModulePreferencesByWorkspace(tenant);
  const composed = composeStudentsSettings(field, prefs);
  const formTabs = await mergeFormTabsFromCustomTabs({
    moduleId: 'students',
    documentFormTabs: composed.formTabs,
    fields: composed.fields as Record<string, FieldDefinition[]> | undefined,
    mapRow: mapCustomTabRowToFormTabFields,
    merge: mergeStudentsFormTabsFromApi,
  });
  return { ...composed, formTabs };
}
