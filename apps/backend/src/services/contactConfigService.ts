import {
  DEFAULT_FORM_TABS,
  migrateEmergencyTabToRelationship,
  type FieldConfig,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  getContactFieldConfigByWorkspace,
  upsertContactFieldConfig,
} from '../db/repositories/contactFieldConfigRepository.js';
import { loadCustomTabs } from './customTabsService.js';

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant.trim().toLowerCase();
}

function stripFormTabs(config: FieldConfig): Record<string, unknown> {
  const { formTabs: _formTabs, ...rest } = config;
  return rest as Record<string, unknown>;
}

export async function loadContactFieldConfig(): Promise<FieldConfig | null> {
  const raw = await getContactFieldConfigByWorkspace(requireTenant());
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const config = migrateEmergencyTabToRelationship(raw as unknown as FieldConfig);

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
  const formTabs =
    customFormTabs.length > 0
      ? [...customFormTabs, ...baseTabs.filter((bt) => !customFormTabs.some((ct) => ct.key === bt.key))]
      : baseTabs;

  return {
    ...config,
    formTabs,
  };
}

export async function saveContactFieldConfig(config: FieldConfig): Promise<FieldConfig> {
  const tenant = requireTenant();
  await upsertContactFieldConfig(tenant, stripFormTabs(config));
  const loaded = await loadContactFieldConfig();
  if (!loaded) throw new Error('Failed to reload contact field config after save');
  return loaded;
}
