import {
  composeFinanceSettings,
  mergeFinanceFormTabsFromApi,
  stripFinanceFieldConfigForPersist,
  type FieldDefinition,
  type FinanceSettings,
  type TabDefinition,
} from '@mms/shared';
import {
  createModuleFieldConfigService,
  mapCustomTabRowToFormTabFields,
  requireFieldConfigTenant,
} from './createModuleFieldConfigService.js';
import {
  getFinanceFieldConfigByWorkspace,
  upsertFinanceFieldConfig,
} from '../db/repositories/financeFieldConfigRepository.js';
import { getFinanceModulePreferencesByWorkspace } from '../db/repositories/financeModulePreferencesRepository.js';
import { mergeFormTabsFromCustomTabs } from '../services/mergeFormTabsFromCustomTabs.js';

const financeFieldConfig = createModuleFieldConfigService<
  Record<string, unknown>,
  FinanceSettings,
  TabDefinition,
  Record<string, FieldDefinition[]> | undefined,
  ReturnType<typeof stripFinanceFieldConfigForPersist>
>({
  moduleId: 'finance',
  broadcastKey: 'finance',
  getByWorkspace: getFinanceFieldConfigByWorkspace,
  upsert: upsertFinanceFieldConfig,
  mapRow: mapCustomTabRowToFormTabFields,
  merge: mergeFinanceFormTabsFromApi,
  toDocument: async (raw, tenant) => {
    const prefs = await getFinanceModulePreferencesByWorkspace(tenant);
    return composeFinanceSettings(raw, prefs);
  },
  stripForPersist: stripFinanceFieldConfigForPersist,
  reloadFailedMessage: 'Failed to reload finance field config after save',
});

export const loadFinanceFieldConfig = financeFieldConfig.load;

export async function saveFinanceFieldConfig(
  config: FinanceSettings | Record<string, unknown>,
): Promise<FinanceSettings> {
  return financeFieldConfig.save(config as FinanceSettings);
}

/** Full FinanceSettings for export / validation (field-config + preferences + tabs). */
export async function loadFinanceSettingsCombined(): Promise<FinanceSettings> {
  const tenant = requireFieldConfigTenant();
  const field = await getFinanceFieldConfigByWorkspace(tenant);
  const prefs = await getFinanceModulePreferencesByWorkspace(tenant);
  const composed = composeFinanceSettings(field, prefs);
  const formTabs = await mergeFormTabsFromCustomTabs({
    moduleId: 'finance',
    documentFormTabs: composed.formTabs,
    fields: composed.fields as Record<string, FieldDefinition[]> | undefined,
    mapRow: mapCustomTabRowToFormTabFields,
    merge: mergeFinanceFormTabsFromApi,
  });
  return { ...composed, formTabs };
}
