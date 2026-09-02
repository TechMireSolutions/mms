import { randomBytes } from 'node:crypto';
import {
  type Workspace,
  type PublicWorkspaceSummary,
  type PlatformWorkspaceRow,
  type BrandingSettings,
  DEFAULT_USERS_SETTINGS,
  SYSTEM_MODULES,
  mergeBrandingSettings,
  normalizeUserModulePreferences,
  slugifySubdomain,
  isValidSubdomain,
  isInstitutionSetupComplete,
  isWorkspaceEnabled,
  toPublicBranding,
} from '@mms/shared';
import {
  purgeTenantDataBySubdomain,
  runInTransaction,
} from '../db/database.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  deleteWorkspaceRow,
  findWorkspaceRowBySubdomain,
  getWorkspaceBranding,
  getWorkspaceGlobalSettings,
  getWorkspaceGrantedModulesRepo,
  insertWorkspaceRow,
  listWorkspaceRows,
  updateWorkspaceBrandingRow,
  updateWorkspaceEnabledRow,
  updateWorkspaceGrantedAndEnabledModulesRepo,
  upsertWorkspaceBranding as upsertWorkspaceBrandingRepo,
} from '../db/repositories/workspaceRepository.js';
import {
  getUserModulePreferencesByWorkspace,
  upsertUserModulePreferences,
} from '../db/repositories/userModulePreferencesRepository.js';

async function listWorkspaces(): Promise<Workspace[]> {
  return listWorkspaceRows();
}

/** Public branding for a workspace subdomain (login shell, registry cards). */
export async function fetchPublicBrandingForSubdomain(subdomain: string) {
  const branding = await getWorkspaceBranding(subdomain);
  return toPublicBranding(branding ? branding : mergeBrandingSettings(null));
}

/** Workspace-wide setup state derived from authoritative persisted branding. */
export async function getWorkspaceInstitutionSetupStatus(subdomain: string): Promise<boolean> {
  const branding = await getWorkspaceBranding(normalizeSubdomainInput(subdomain));
  return isInstitutionSetupComplete(branding);
}

export function normalizeSubdomainInput(value: string): string {
  return slugifySubdomain(value);
}

/** All registered workspaces for apex picker (active only; public name from branding). */
export async function listPublicWorkspaces(): Promise<PublicWorkspaceSummary[]> {
  const workspaces = await listWorkspaces();
  const active = workspaces.filter(isWorkspaceEnabled);
  const summaries = await Promise.all(
    active.map(async (ws) => {
      const branding = await fetchPublicBrandingForSubdomain(ws.subdomain);
      const logoUrl = branding.logoUrl?.trim();
      return {
        subdomain: ws.subdomain,
        madrasaName: branding.madrasaName || ws.madrasaName,
        tagline: branding.tagline || ws.tagline,
        logoUrl: logoUrl || undefined,
      };
    })
  );
  return summaries.sort((a, b) => a.madrasaName.localeCompare(b.madrasaName));
}

/** All workspaces for platform super-user console (includes disabled). */
export async function listPlatformWorkspaces(): Promise<PlatformWorkspaceRow[]> {
  const workspaces = await listWorkspaces();
  const summaries = await Promise.all(
    workspaces.map(async (ws) => {
      const [branding, rawPrefs] = await Promise.all([
        fetchPublicBrandingForSubdomain(ws.subdomain),
        getUserModulePreferencesByWorkspace(ws.subdomain),
      ]);
      const prefs = normalizeUserModulePreferences(rawPrefs);
      const logoUrl = branding.logoUrl?.trim();
      return {
        subdomain: ws.subdomain,
        madrasaName: branding.madrasaName || ws.madrasaName,
        tagline: branding.tagline || ws.tagline,
        logoUrl: logoUrl || undefined,
        enabled: isWorkspaceEnabled(ws),
        createdAt: ws.createdAt,
        requireEmailVerification: prefs.requireEmailVerification ?? DEFAULT_USERS_SETTINGS.requireEmailVerification,
      };
    }),
  );
  return summaries.sort((a, b) => a.madrasaName.localeCompare(b.madrasaName));
}

/** Permanently removes a workspace registry entry and all tenant-scoped data. */
export async function deleteWorkspace(subdomain: string): Promise<Workspace | null> {
  const normalized = normalizeSubdomainInput(subdomain);
  return runInTransaction(async () => {
    const ws = await getWorkspaceBySubdomain(normalized);
    if (!ws) return null;
    await purgeTenantDataBySubdomain(normalized);
    await deleteWorkspaceRow(normalized);
    return ws;
  });
}

export async function setWorkspaceEnabled(
  subdomain: string,
  enabled: boolean,
): Promise<Workspace | null> {
  const normalized = normalizeSubdomainInput(subdomain);
  return runInTransaction(async () => {
    const ws = await getWorkspaceBySubdomain(normalized);
    if (!ws) return null;
    await updateWorkspaceEnabledRow(normalized, enabled);
    return { ...ws, enabled };
  });
}

export async function setWorkspaceEmailVerification(
  subdomain: string,
  requireEmailVerification: boolean,
): Promise<{ subdomain: string; requireEmailVerification: boolean } | null> {
  const normalized = normalizeSubdomainInput(subdomain);
  const ws = await getWorkspaceBySubdomain(normalized);
  if (!ws) return null;

  const rawPrefs = await getUserModulePreferencesByWorkspace(normalized);
  const prefs = normalizeUserModulePreferences(rawPrefs);
  const updatedPrefs = {
    ...prefs,
    requireEmailVerification,
  };
  await upsertUserModulePreferences(normalized, updatedPrefs as Record<string, unknown>);
  return { subdomain: normalized, requireEmailVerification };
}

export async function assertWorkspaceActive(subdomain: string): Promise<Workspace> {
  const workspace = await getWorkspaceBySubdomain(subdomain);
  if (!workspace) {
    throw Object.assign(new Error('Workspace not found'), { statusCode: 404 });
  }
  if (!isWorkspaceEnabled(workspace)) {
    throw Object.assign(new Error('This madrasa workspace has been disabled by the platform administrator.'), {
      statusCode: 403,
      type: 'workspace_disabled',
    });
  }
  return workspace;
}

export async function getWorkspaceBySubdomain(subdomain: string): Promise<Workspace | null> {
  const normalized = normalizeSubdomainInput(subdomain);
  return findWorkspaceRowBySubdomain(normalized);
}

/** Resolves workspace for the active request tenant only — never falls back on apex. */
export async function getWorkspace(): Promise<Workspace | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  return getWorkspaceBySubdomain(tenant);
}

export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const normalized = normalizeSubdomainInput(subdomain);
  if (!isValidSubdomain(normalized)) return false;
  const workspaces = await listWorkspaces();
  return !workspaces.some((ws) => ws.subdomain === normalized);
}

export async function assertSubdomainAvailable(subdomain: string): Promise<void> {
  if (!isValidSubdomain(normalizeSubdomainInput(subdomain))) {
    throw Object.assign(new Error('Invalid subdomain. Use 2–63 lowercase letters, numbers, and hyphens.'), {
      statusCode: 400,
    });
  }
  if (!(await isSubdomainAvailable(subdomain))) {
    throw Object.assign(new Error('This workspace subdomain is already taken.'), {
      statusCode: 409,
    });
  }
}

/** Keeps the global workspace registry in sync with saved branding name/tagline. */
export async function syncWorkspaceFromBranding(
  subdomain: string,
  branding: Pick<BrandingSettings, 'madrasaName' | 'tagline'>,
): Promise<void> {
  const normalized = normalizeSubdomainInput(subdomain);
  await updateWorkspaceBrandingRow(normalized, branding);
}

/** Write the full BrandingSettings into the workspaces typed columns. */
export async function upsertWorkspaceBranding(
  subdomain: string,
  branding: BrandingSettings,
): Promise<void> {
  const normalized = normalizeSubdomainInput(subdomain);
  await upsertWorkspaceBrandingRepo(normalized, branding);
}

export async function createWorkspace(workspaceInput: {
  subdomain: string;
  madrasaName: string;
  tagline?: string;
  country?: string;
}): Promise<Workspace> {
  const subdomain = normalizeSubdomainInput(workspaceInput.subdomain);
  if (!isValidSubdomain(subdomain)) {
    throw Object.assign(new Error('Invalid subdomain. Use 2–63 lowercase letters, numbers, and hyphens.'), {
      statusCode: 400,
    });
  }

  return runInTransaction(async () => {
    const existing = await getWorkspaceBySubdomain(subdomain);
    if (existing) {
      throw Object.assign(new Error('This workspace subdomain is already taken.'), {
        statusCode: 409,
      });
    }

    const id = randomBytes(8).toString('hex');
    const newWs = {
      id,
      subdomain,
      madrasaName: workspaceInput.madrasaName,
      tagline: workspaceInput.tagline || null,
      country: workspaceInput.country || null,
      enabled: true,
    };

    await insertWorkspaceRow(newWs);

    const { syncPlatformSuperUserToTenant } = await import('./platform/platformSuperUserTenantSyncService.js');
    await syncPlatformSuperUserToTenant(subdomain);

    return {
      ...newWs,
      tagline: newWs.tagline ?? undefined,
      country: newWs.country ?? undefined,
      createdAt: new Date().toISOString(),
    };
  });
}

/**
 * Returns granted module IDs for the specified workspace.
 */
export async function getWorkspaceGrantedModules(subdomain: string): Promise<string[]> {
  const normalized = normalizeSubdomainInput(subdomain);
  return getWorkspaceGrantedModulesRepo(normalized);
}

/**
 * Updates granted and enabled modules for the specified workspace.
 */
export async function updateWorkspaceModules(
  subdomain: string,
  modules: string[],
): Promise<{ modules: string[] }> {
  const normalized = normalizeSubdomainInput(subdomain);
  const globalSettings = await getWorkspaceGlobalSettings(normalized);
  const prevGrantedIds = await getWorkspaceGrantedModulesRepo(normalized);
  const prevGranted = Object.fromEntries(prevGrantedIds.map((id) => [id, true]));
  const prevEnabled = globalSettings?.enabledModules || {};

  const grantedModules: Record<string, boolean> = {};
  const enabledModules: Record<string, boolean> = { ...prevEnabled };

  for (const mod of SYSTEM_MODULES) {
    if (mod.required) {
      grantedModules[mod.id] = true;
      enabledModules[mod.id] = true;
    } else {
      const isGranted = modules.includes(mod.id);
      const wasGranted = prevGranted[mod.id] === true;
      grantedModules[mod.id] = isGranted;

      if (!isGranted) {
        enabledModules[mod.id] = false;
      } else if (!wasGranted) {
        enabledModules[mod.id] = true;
      }
    }
  }

  await updateWorkspaceGrantedAndEnabledModulesRepo(normalized, grantedModules, enabledModules);
  return { modules };
}
