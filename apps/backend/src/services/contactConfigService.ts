import type { FieldConfig } from '@mms/shared';
import { fetchObject } from './dbSyncService.js';

const CONTACT_FIELD_CONFIG_OBJECT_KEY = 'contact_field_config';

export async function loadContactFieldConfig(): Promise<FieldConfig | null> {
  const raw = await fetchObject(CONTACT_FIELD_CONFIG_OBJECT_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as FieldConfig;
}
