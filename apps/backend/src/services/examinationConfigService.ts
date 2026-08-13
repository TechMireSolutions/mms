import {
  composeExaminationsSettings,
  mergeExaminationsFormTabsFromApi,
  stripExaminationsFieldConfigForPersist,
  type FieldDefinition,
  type ExaminationsSettings,
  type TabDefinition,
} from '@mms/shared';
import {
  createModuleFieldConfigService,
  mapCustomTabRowToFormTabFields,
} from '../lib/createModuleFieldConfigService.js';
import {
  getExaminationFieldConfig,
  setExaminationFieldConfig,
} from '../db/repositories/examinationFieldConfigRepository.js';
import { getExaminationModulePreferences } from '../db/repositories/examinationModulePreferencesRepository.js';

const examinationFieldConfig = createModuleFieldConfigService<
  Record<string, unknown>,
  ExaminationsSettings,
  TabDefinition,
  Record<string, FieldDefinition[]> | undefined,
  ReturnType<typeof stripExaminationsFieldConfigForPersist>
>({
  moduleId: 'examinations',
  broadcastKey: 'examinations',
  getByWorkspace: getExaminationFieldConfig,
  upsert: setExaminationFieldConfig,
  mapRow: mapCustomTabRowToFormTabFields,
  merge: mergeExaminationsFormTabsFromApi,
  toDocument: async (raw, tenant) => {
    const prefs = await getExaminationModulePreferences(tenant);
    return composeExaminationsSettings((raw as unknown) as ExaminationsSettings, (prefs || {}) as any);
  },
  stripForPersist: stripExaminationsFieldConfigForPersist,
  reloadFailedMessage: 'Failed to reload examinations field config after save',
});

export const getExaminationFieldConfigService = examinationFieldConfig.load;

export async function updateExaminationFieldConfigService(
  config: ExaminationsSettings | Record<string, unknown>,
): Promise<ExaminationsSettings> {
  return examinationFieldConfig.save(config as Partial<ExaminationsSettings> as any);
}
