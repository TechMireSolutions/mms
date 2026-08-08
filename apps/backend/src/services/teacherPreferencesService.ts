import {
  normalizeTeacherModulePreferences,
  type TeacherModulePreferences,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  getTeacherModulePreferencesByWorkspace,
  upsertTeacherModulePreferences,
} from '../db/repositories/teacherModulePreferencesRepository.js';
import { broadcastCollection } from './websocketService.js';

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant.trim().toLowerCase();
}

export async function loadTeacherModulePreferences(): Promise<TeacherModulePreferences | null> {
  const raw = await getTeacherModulePreferencesByWorkspace(requireTenant());
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return normalizeTeacherModulePreferences(raw);
}

export async function saveTeacherModulePreferences(
  preferences: TeacherModulePreferences | Record<string, unknown>,
): Promise<TeacherModulePreferences> {
  const tenant = requireTenant();
  const normalized = normalizeTeacherModulePreferences(preferences);
  await upsertTeacherModulePreferences(
    tenant,
    normalized as unknown as Record<string, unknown>,
  );
  await broadcastCollection('teachers');
  return normalized;
}
