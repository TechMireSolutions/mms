import {
  normalizeUserModulePreferences,
  type UserModulePreferences,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  getUserModulePreferencesByWorkspace,
  upsertUserModulePreferences,
} from '../db/repositories/userModulePreferencesRepository.js';
import { broadcastCollection } from './websocketService.js';

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant.trim().toLowerCase();
}

export async function loadUserModulePreferences(): Promise<UserModulePreferences | null> {
  const raw = await getUserModulePreferencesByWorkspace(requireTenant());
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return normalizeUserModulePreferences(raw);
}

export async function saveUserModulePreferences(
  preferences: UserModulePreferences | Record<string, unknown>,
): Promise<UserModulePreferences> {
  const tenant = requireTenant();
  const normalized = normalizeUserModulePreferences(preferences);
  await upsertUserModulePreferences(
    tenant,
    normalized as unknown as Record<string, unknown>,
  );
  await broadcastCollection('users');
  return normalized;
}
