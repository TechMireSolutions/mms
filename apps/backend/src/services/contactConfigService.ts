import { DEFAULT_FORM_TABS, type FieldConfig } from '@mms/shared';
import { fetchObject } from './dbSyncService.js';
import { loadCustomTabs } from './customTabsService.js';

const CONTACT_FIELD_CONFIG_OBJECT_KEY = 'contact_field_config';

export async function loadContactFieldConfig(): Promise<FieldConfig | null> {
  const raw = await fetchObject(CONTACT_FIELD_CONFIG_OBJECT_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const config = raw as FieldConfig;

  const tabRows = await loadCustomTabs('contacts');
  const customFormTabs = tabRows.map((row) => ({
    key: row.key,
    label: row.label,
    icon: row.icon ?? undefined,
    enabled: row.enabled,
    order: row.sortOrder,
    permissions: (row.permissions as string[]) ?? undefined,
    description: row.description ?? undefined,
    color: row.color ?? undefined,
    isSystem: row.isSystem,
  }));

  const baseTabs = config.formTabs && config.formTabs.length > 0 ? config.formTabs : DEFAULT_FORM_TABS;
  const formTabs = customFormTabs.length > 0
    ? [...customFormTabs, ...baseTabs.filter((bt) => !customFormTabs.some((ct) => ct.key === bt.key))]
    : baseTabs;

  return {
    ...config,
    formTabs,
  };
}
