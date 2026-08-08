import {
  normalizeEnrollmentModulePreferences,
  type EnrollmentModulePreferences,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  getEnrollmentModulePreferencesByWorkspace,
  upsertEnrollmentModulePreferences,
} from '../db/repositories/enrollmentModulePreferencesRepository.js';
import { broadcastCollection } from './websocketService.js';

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant.trim().toLowerCase();
}

export async function loadEnrollmentModulePreferences(): Promise<EnrollmentModulePreferences | null> {
  const raw = await getEnrollmentModulePreferencesByWorkspace(requireTenant());
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return normalizeEnrollmentModulePreferences(raw);
}

export async function saveEnrollmentModulePreferences(
  preferences: EnrollmentModulePreferences | Record<string, unknown>,
): Promise<EnrollmentModulePreferences> {
  const tenant = requireTenant();
  const normalized = normalizeEnrollmentModulePreferences(preferences);
  await upsertEnrollmentModulePreferences(
    tenant,
    normalized as unknown as Record<string, unknown>,
  );
  await broadcastCollection('enrollments');
  return normalized;
}
