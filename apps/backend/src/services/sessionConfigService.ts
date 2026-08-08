import {
  composeSessionsSettings,
  mergeSessionsFormTabsFromApi,
  stripSessionFieldConfigForPersist,
  type FieldDefinition,
  type SessionsSettings,
  type TabDefinition,
} from '@mms/shared';
import {
  createModuleFieldConfigService,
  mapCustomTabRowToFormTabFields,
  requireFieldConfigTenant,
} from '../lib/createModuleFieldConfigService.js';
import {
  getSessionFieldConfigByWorkspace,
  upsertSessionFieldConfig,
} from '../db/repositories/sessionFieldConfigRepository.js';
import { getSessionModulePreferencesByWorkspace } from '../db/repositories/sessionModulePreferencesRepository.js';
import { mergeFormTabsFromCustomTabs } from './mergeFormTabsFromCustomTabs.js';

const sessionFieldConfig = createModuleFieldConfigService<
  Record<string, unknown>,
  SessionsSettings,
  TabDefinition,
  Record<string, FieldDefinition[]> | undefined,
  ReturnType<typeof stripSessionFieldConfigForPersist>
>({
  moduleId: 'sessions',
  broadcastKey: 'sessions',
  getByWorkspace: getSessionFieldConfigByWorkspace,
  upsert: upsertSessionFieldConfig,
  mapRow: mapCustomTabRowToFormTabFields,
  merge: mergeSessionsFormTabsFromApi,
  toDocument: async (raw, tenant) => {
    const prefs = await getSessionModulePreferencesByWorkspace(tenant);
    return composeSessionsSettings(raw, prefs);
  },
  stripForPersist: stripSessionFieldConfigForPersist,
  reloadFailedMessage: 'Failed to reload session field config after save',
});

export const loadSessionFieldConfig = sessionFieldConfig.load;

export async function saveSessionFieldConfig(
  config: SessionsSettings | Record<string, unknown>,
): Promise<SessionsSettings> {
  return sessionFieldConfig.save(config as SessionsSettings);
}

/** Full SessionsSettings for export / validation (field-config + preferences + tabs). */
export async function loadSessionsSettingsCombined(): Promise<SessionsSettings> {
  const tenant = requireFieldConfigTenant();
  const field = await getSessionFieldConfigByWorkspace(tenant);
  const prefs = await getSessionModulePreferencesByWorkspace(tenant);
  const composed = composeSessionsSettings(field, prefs);
  const formTabs = await mergeFormTabsFromCustomTabs({
    moduleId: 'sessions',
    documentFormTabs: composed.formTabs,
    fields: composed.fields as Record<string, FieldDefinition[]> | undefined,
    mapRow: mapCustomTabRowToFormTabFields,
    merge: mergeSessionsFormTabsFromApi,
  });
  return { ...composed, formTabs };
}
