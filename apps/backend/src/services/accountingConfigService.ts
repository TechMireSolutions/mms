import {
  composeAccountingSettings,
  stripAccountingFieldConfigForPersist,
  type FieldDefinition,
  type AccountingSettings,
  type TabDefinition,  type AccountingModulePreferences,
} from '@mms/shared';
import { createModuleFieldConfigService } from '../lib/createModuleFieldConfigService.js';
import {
  getAccountingFieldConfig,
  setAccountingFieldConfig,
} from '../db/repositories/accountingFieldConfigRepository.js';
import { getAccountingModulePreferences } from '../db/repositories/accountingModulePreferencesRepository.js';

const accountingFieldConfig = createModuleFieldConfigService<
  Record<string, unknown>,
  AccountingSettings,
  TabDefinition,
  Record<string, FieldDefinition[]> | undefined,
  ReturnType<typeof stripAccountingFieldConfigForPersist>
>({
  broadcastKey: 'accounting',
  getByWorkspace: getAccountingFieldConfig,
  upsert: setAccountingFieldConfig,
  toDocument: async (raw, tenant) => {
    const prefs = await getAccountingModulePreferences(tenant);
    return composeAccountingSettings((raw as unknown) as AccountingSettings, // (typed as AccountingModulePreferences because preferences are untyped JSON rows)
    // (typed as AccountingModulePreferences because preferences are untyped JSON rows from the db)
    (prefs || {}) as unknown as AccountingModulePreferences);
  },
  stripForPersist: stripAccountingFieldConfigForPersist,
  reloadFailedMessage: 'Failed to reload accounting field config after save',
});

export const getAccountingFieldConfigService = accountingFieldConfig.load;

export async function updateAccountingFieldConfigService(
  config: AccountingSettings | Record<string, unknown>,
): Promise<AccountingSettings> {
  return accountingFieldConfig.save(config as AccountingSettings);
}

