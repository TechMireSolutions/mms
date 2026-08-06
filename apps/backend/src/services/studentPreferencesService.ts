import {
  normalizeStudentModulePreferences,
  type StudentModulePreferences,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  getStudentModulePreferencesByWorkspace,
  upsertStudentModulePreferences,
} from '../db/repositories/studentModulePreferencesRepository.js';
import { broadcastTenantUpdate } from './websocketService.js';

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant.trim().toLowerCase();
}

export async function loadStudentModulePreferences(): Promise<StudentModulePreferences | null> {
  const raw = await getStudentModulePreferencesByWorkspace(requireTenant());
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return normalizeStudentModulePreferences(raw);
}

export async function saveStudentModulePreferences(
  preferences: StudentModulePreferences | Record<string, unknown>,
): Promise<StudentModulePreferences> {
  const tenant = requireTenant();
  const normalized = normalizeStudentModulePreferences(preferences);
  await upsertStudentModulePreferences(
    tenant,
    normalized as unknown as Record<string, unknown>,
  );
  broadcastTenantUpdate(tenant, 'collection', 'students');
  return normalized;
}
