import {
  composeEnrollmentsSettings,
  mergeEnrollmentsFormTabsFromApi,
  stripEnrollmentFieldConfigForPersist,
  type FieldDefinition,
  type EnrollmentsSettings,
  type TabDefinition,
} from '@mms/shared';
import {
  createModuleFieldConfigService,
  mapCustomTabRowToFormTabFields,
  requireFieldConfigTenant,
} from '../lib/createModuleFieldConfigService.js';
import {
  getEnrollmentFieldConfigByWorkspace,
  upsertEnrollmentFieldConfig,
} from '../db/repositories/enrollmentFieldConfigRepository.js';
import { getEnrollmentModulePreferencesByWorkspace } from '../db/repositories/enrollmentModulePreferencesRepository.js';
import { mergeFormTabsFromCustomTabs } from './mergeFormTabsFromCustomTabs.js';

const enrollmentFieldConfig = createModuleFieldConfigService<
  Record<string, unknown>,
  EnrollmentsSettings,
  TabDefinition,
  Record<string, FieldDefinition[]> | undefined,
  ReturnType<typeof stripEnrollmentFieldConfigForPersist>
>({
  moduleId: 'enrollment',
  broadcastKey: 'enrollments',
  getByWorkspace: getEnrollmentFieldConfigByWorkspace,
  upsert: upsertEnrollmentFieldConfig,
  mapRow: mapCustomTabRowToFormTabFields,
  merge: mergeEnrollmentsFormTabsFromApi,
  toDocument: async (raw, tenant) => {
    const prefs = await getEnrollmentModulePreferencesByWorkspace(tenant);
    return composeEnrollmentsSettings(raw, prefs);
  },
  stripForPersist: stripEnrollmentFieldConfigForPersist,
  reloadFailedMessage: 'Failed to reload enrollment field config after save',
});

export const loadEnrollmentFieldConfig = enrollmentFieldConfig.load;

export async function saveEnrollmentFieldConfig(
  config: EnrollmentsSettings | Record<string, unknown>,
): Promise<EnrollmentsSettings> {
  return enrollmentFieldConfig.save(config as EnrollmentsSettings);
}

/** Full EnrollmentsSettings for export / validation (field-config + preferences + tabs). */
export async function loadEnrollmentsSettingsCombined(): Promise<EnrollmentsSettings> {
  const tenant = requireFieldConfigTenant();
  const field = await getEnrollmentFieldConfigByWorkspace(tenant);
  const prefs = await getEnrollmentModulePreferencesByWorkspace(tenant);
  const composed = composeEnrollmentsSettings(field, prefs);
  const formTabs = await mergeFormTabsFromCustomTabs({
    moduleId: 'enrollment',
    documentFormTabs: composed.formTabs,
    fields: composed.fields as Record<string, FieldDefinition[]> | undefined,
    mapRow: mapCustomTabRowToFormTabFields,
    merge: mergeEnrollmentsFormTabsFromApi,
  });
  return { ...composed, formTabs };
}
