import { randomBytes } from 'node:crypto';
import {
  type Workspace,
  type PublicWorkspaceSummary,
  type PlatformWorkspaceRow,
  type BrandingSettings,
  SYSTEM_MODULES,
  mergeBrandingSettings,
  slugifySubdomain,
  isValidSubdomain,
  isWorkspaceEnabled,
  toPublicBranding,
} from '@mms/shared';
import {
  getObject,
  saveObject,
  purgeTenantDataBySubdomain,
  runInTransaction,
} from '../db/database.js';
import { getRequestTenant, runWithTenant } from '../lib/tenantContext.js';
import {
  deleteWorkspaceRow,
  findWorkspaceRowBySubdomain,
  insertWorkspaceRow,
  listWorkspaceRows,
  updateWorkspaceBrandingRow,
  updateWorkspaceEnabledRow,
} from '../db/repositories/workspaceRepository.js';

async function listWorkspaces(): Promise<Workspace[]> {
  return listWorkspaceRows();
}

/** Public branding for a workspace subdomain (login shell, registry cards). */
export async function fetchPublicBrandingForSubdomain(subdomain: string) {
  return runWithTenant(subdomain, async () => {
    const raw = await getObject('branding');
    return toPublicBranding(mergeBrandingSettings(raw as Record<string, unknown> | null));
  });
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
      const branding = await fetchPublicBrandingForSubdomain(ws.subdomain);
      const logoUrl = branding.logoUrl?.trim();
      return {
        subdomain: ws.subdomain,
        madrasaName: branding.madrasaName || ws.madrasaName,
        tagline: branding.tagline || ws.tagline,
        logoUrl: logoUrl || undefined,
        enabled: isWorkspaceEnabled(ws),
        createdAt: ws.createdAt,
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
  return runWithTenant(normalized, async () => {
    const platformSettings = (await getObject('platform_settings')) as Record<string, unknown> | null;
    const grantedModules = (platformSettings?.grantedModules as Record<string, boolean> | undefined) || {};
    return Object.entries(grantedModules)
      .filter(([_, granted]) => Boolean(granted))
      .map(([id]) => id);
  });
}

/**
 * Updates granted and enabled modules for the specified workspace.
 */
export async function updateWorkspaceModules(
  subdomain: string,
  modules: string[],
): Promise<{ modules: string[] }> {
  const normalized = normalizeSubdomainInput(subdomain);
  return runWithTenant(normalized, async () => {
    const platformSettings = ((await getObject('platform_settings')) as Record<string, unknown> | null) || {};
    const globalSettings = ((await getObject('global_settings')) as Record<string, unknown> | null) || {};

    const prevGranted = (platformSettings.grantedModules as Record<string, boolean> | undefined) || {};
    const prevEnabled = (globalSettings.enabledModules as Record<string, boolean> | undefined) || {};

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

    await saveObject('platform_settings', {
      ...platformSettings,
      grantedModules,
    });

    await saveObject('global_settings', {
      ...globalSettings,
      enabledModules,
    });

    return { modules };
  });
}
