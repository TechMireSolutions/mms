import type { FieldConfig } from '@mms/shared';
import { fetchObject } from './dbSyncService.js';

const CONFIG_KEY = 'contact_field_config';

export async function loadContactFieldConfig(): Promise<FieldConfig | null> {
  const raw = await fetchObject(CONFIG_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as FieldConfig;
}
