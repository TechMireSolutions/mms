import {
  migrateEmergencyTabToRelationship,
  type FieldConfig,
  type TabDefinition,
} from '@mms/shared';
import { createModuleFieldConfigService } from './createModuleFieldConfigService.js';
import {
  getContactFieldConfigByWorkspace,
  upsertContactFieldConfig,
} from '../db/repositories/contactFieldConfigRepository.js';

function stripFormTabs(config: FieldConfig): Record<string, unknown> {
  const { formTabs: _formTabs, ...rest } = config;
  return rest as Record<string, unknown>;
}

const contactFieldConfig = createModuleFieldConfigService<
  Record<string, unknown>,
  FieldConfig,
  TabDefinition,
  FieldConfig['fields'],
  Record<string, unknown>
>({
  broadcastKey: 'contacts',
  getByWorkspace: getContactFieldConfigByWorkspace,
  upsert: upsertContactFieldConfig,
  toDocument: (raw) => migrateEmergencyTabToRelationship(raw as unknown as FieldConfig),
  stripForPersist: stripFormTabs,
  reloadFailedMessage: 'Failed to reload contact field config after save',
});

export const loadContactFieldConfig = contactFieldConfig.load;
export const saveContactFieldConfig = contactFieldConfig.save;

