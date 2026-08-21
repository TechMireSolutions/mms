import {
  mergeGlobalSettings,
  parseSessionTimeoutMinutes,
  validatePasswordPolicy,
  type GlobalSettings,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  getWorkspaceGlobalSettings,
  upsertWorkspaceGlobalSettings as upsertWorkspaceGlobalSettingsRepo,
} from '../db/repositories/workspaceRepository.js';

/** Loads merged global settings for the current request tenant (or specified subdomain). */
export async function loadGlobalSettings(subdomain?: string): Promise<GlobalSettings> {
  const tenant = subdomain ?? getRequestTenant();
  if (!tenant) {
    return mergeGlobalSettings(null);
  }
  try {
    const settings = await getWorkspaceGlobalSettings(tenant);
    return settings ?? mergeGlobalSettings(null);
  } catch {
    return mergeGlobalSettings(null);
  }
}

/** Saves full global settings for the current request tenant (or specified subdomain). */
export async function saveGlobalSettings(
  settings: GlobalSettings,
  subdomain?: string,
): Promise<void> {
  const tenant = subdomain ?? getRequestTenant();
  if (!tenant) {
    throw new Error('Tenant context required to save global settings');
  }
  await upsertWorkspaceGlobalSettingsRepo(tenant, settings);
}

/** JWT `expiresIn` string from session timeout preference. */
export async function getJwtExpiresIn(): Promise<string> {
  const settings = await loadGlobalSettings();
  return `${parseSessionTimeoutMinutes(settings.sessionTimeout)}m`;
}

/**
 * Validates password against stored policy. Throws Error with statusCode 400 when invalid.
 */
export async function assertPasswordMeetsPolicy(password: string): Promise<void> {
  const settings = await loadGlobalSettings();
  const result = validatePasswordPolicy(password, settings.passwordPolicy);
  if (!result.valid) {
    const err = new Error(result.message);
    (err as Error & { statusCode: number }).statusCode = 400;
    throw err;
  }
}
