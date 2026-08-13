import {
  composeHasanatSettings,
  mergeHasanatFormTabsFromApi,
  stripHasanatFieldConfigForPersist,
  type FieldDefinition,
  type HasanatSettings,
  type TabDefinition,
} from '@mms/shared';
import {
  createModuleFieldConfigService,
  mapCustomTabRowToFormTabFields,
} from '../lib/createModuleFieldConfigService.js';
import {
  getHasanatFieldConfig,
  setHasanatFieldConfig,
} from '../db/repositories/hasanatFieldConfigRepository.js';
import { getHasanatModulePreferences } from '../db/repositories/hasanatModulePreferencesRepository.js';

const hasanatFieldConfig = createModuleFieldConfigService<
  Record<string, unknown>,
  HasanatSettings,
  TabDefinition,
  Record<string, FieldDefinition[]> | undefined,
  ReturnType<typeof stripHasanatFieldConfigForPersist>
>({
  moduleId: 'hasanat',
  broadcastKey: 'hasanat',
  getByWorkspace: getHasanatFieldConfig,
  upsert: setHasanatFieldConfig,
  mapRow: mapCustomTabRowToFormTabFields,
  merge: mergeHasanatFormTabsFromApi,
  toDocument: async (raw, tenant) => {
    const prefs = await getHasanatModulePreferences(tenant);
    return composeHasanatSettings((raw as unknown) as HasanatSettings, (prefs || {}) as any);
  },
  stripForPersist: stripHasanatFieldConfigForPersist,
  reloadFailedMessage: 'Failed to reload hasanat field config after save',
});

export const getHasanatFieldConfigService = hasanatFieldConfig.load;

export async function updateHasanatFieldConfigService(
  config: HasanatSettings | Record<string, unknown>,
): Promise<HasanatSettings> {
  return hasanatFieldConfig.save(config as Partial<HasanatSettings> as any);
}
