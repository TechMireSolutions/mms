import {
  composeStudentsSettings,
  mergeStudentsFormTabsFromApi,
  stripStudentFieldConfigForPersist,
  type FieldDefinition,
  type StudentsSettings,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  getStudentFieldConfigByWorkspace,
  upsertStudentFieldConfig,
} from '../db/repositories/studentFieldConfigRepository.js';
import { getStudentModulePreferencesByWorkspace } from '../db/repositories/studentModulePreferencesRepository.js';
import { loadCustomTabs } from './customTabsService.js';
import { broadcastTenantUpdate } from './websocketService.js';

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant.trim().toLowerCase();
}

async function loadFormTabsFromCustomTabs(
  documentFormTabs: StudentsSettings['formTabs'],
  fields: StudentsSettings['fields'],
) {
  const tabRows = await loadCustomTabs('students');
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
  return mergeStudentsFormTabsFromApi(
    documentFormTabs,
    customFormTabs,
    fields as Record<string, FieldDefinition[]> | undefined,
  );
}

/** Load typed field-config row (merged with custom_tabs for formTabs). */
export async function loadStudentFieldConfig(): Promise<StudentsSettings | null> {
  const raw = await getStudentFieldConfigByWorkspace(requireTenant());
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const prefs = await getStudentModulePreferencesByWorkspace(requireTenant());
  const composed = composeStudentsSettings(raw, prefs);
  const formTabs = await loadFormTabsFromCustomTabs(composed.formTabs, composed.fields);
  return { ...composed, formTabs };
}

export async function saveStudentFieldConfig(
  config: StudentsSettings | Record<string, unknown>,
): Promise<StudentsSettings> {
  const tenant = requireTenant();
  await upsertStudentFieldConfig(tenant, stripStudentFieldConfigForPersist(config));
  const loaded = await loadStudentFieldConfig();
  if (!loaded) throw new Error('Failed to reload student field config after save');
  broadcastTenantUpdate(tenant, 'collection', 'students');
  return loaded;
}

/** Full StudentsSettings for validation / GR (field-config + preferences + tabs). */
export async function loadStudentsSettingsCombined(): Promise<StudentsSettings> {
  const field = await getStudentFieldConfigByWorkspace(requireTenant());
  const prefs = await getStudentModulePreferencesByWorkspace(requireTenant());
  const composed = composeStudentsSettings(field, prefs);
  const formTabs = await loadFormTabsFromCustomTabs(composed.formTabs, composed.fields);
  return { ...composed, formTabs };
}
