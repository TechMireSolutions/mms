import {
  composeExaminationsSettings,
  stripExaminationsFieldConfigForPersist,
  type FieldDefinition,
  type ExaminationsSettings,
  type TabDefinition,  type ExaminationsModulePreferences,
} from '@mms/shared';
import { createModuleFieldConfigService } from '../lib/createModuleFieldConfigService.js';
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
  broadcastKey: 'examinations',
  getByWorkspace: getExaminationFieldConfig,
  upsert: setExaminationFieldConfig,
  toDocument: async (raw, tenant) => {
    const prefs = await getExaminationModulePreferences(tenant);
    return composeExaminationsSettings((raw as unknown) as ExaminationsSettings, // (typed as ExaminationsModulePreferences because preferences are untyped JSON rows)
    // (typed as ExaminationsModulePreferences because preferences are untyped JSON rows from the db)
    (prefs || {}) as unknown as ExaminationsModulePreferences);
  },
  stripForPersist: stripExaminationsFieldConfigForPersist,
  reloadFailedMessage: 'Failed to reload examinations field config after save',
});

export const getExaminationFieldConfigService = examinationFieldConfig.load;

export async function updateExaminationFieldConfigService(
  config: ExaminationsSettings | Record<string, unknown>,
): Promise<ExaminationsSettings> {
  return examinationFieldConfig.save(config as ExaminationsSettings);
}

