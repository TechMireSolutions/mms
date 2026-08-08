import {
  normalizeSessionModulePreferences,
  type SessionModulePreferences,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  getSessionModulePreferencesByWorkspace,
  upsertSessionModulePreferences,
} from '../db/repositories/sessionModulePreferencesRepository.js';
import { broadcastCollection } from './websocketService.js';

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant.trim().toLowerCase();
}

export async function loadSessionModulePreferences(): Promise<SessionModulePreferences | null> {
  const raw = await getSessionModulePreferencesByWorkspace(requireTenant());
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return normalizeSessionModulePreferences(raw);
}

export async function saveSessionModulePreferences(
  preferences: SessionModulePreferences | Record<string, unknown>,
): Promise<SessionModulePreferences> {
  const tenant = requireTenant();
  const normalized = normalizeSessionModulePreferences(preferences);
  await upsertSessionModulePreferences(
    tenant,
    normalized as unknown as Record<string, unknown>,
  );
  await broadcastCollection('sessions');
  return normalized;
}
