import { randomBytes } from 'node:crypto';
import {
  type Workspace,
  type PublicWorkspaceSummary,
  type PlatformWorkspaceRow,
  type BrandingSettings,
  mergeBrandingSettings,
  slugifySubdomain,
  isValidSubdomain,
  isWorkspaceEnabled,
  toPublicBranding,
  WORKSPACES_COLLECTION,
} from '@mms/shared';
import {
  getCollection,
  saveCollection,
  getObject,
  purgeTenantDataBySubdomain,
  runInTransaction,
} from '../db/database.js';
import { getRequestTenant, runWithTenant } from '../lib/tenantContext.js';

async function listWorkspaces(): Promise<Workspace[]> {
  const raw = await getCollection(WORKSPACES_COLLECTION);
  if (!Array.isArray(raw)) return [];
  return raw as Workspace[];
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
  const workspaces = await listWorkspaces();
  const index = workspaces.findIndex((ws) => ws.subdomain === normalized);
  if (index === -1) return null;

  const removed = workspaces[index];
  await runInTransaction(async () => {
    await purgeTenantDataBySubdomain(normalized);
    workspaces.splice(index, 1);
    await saveCollection(WORKSPACES_COLLECTION, workspaces);
  });
  return removed;
}

export async function setWorkspaceEnabled(
  subdomain: string,
  enabled: boolean,
): Promise<Workspace | null> {
  const normalized = normalizeSubdomainInput(subdomain);
  const workspaces = await listWorkspaces();
  const index = workspaces.findIndex((ws) => ws.subdomain === normalized);
  if (index === -1) return null;

  workspaces[index] = { ...workspaces[index], enabled };
  await saveCollection(WORKSPACES_COLLECTION, workspaces);
  return workspaces[index];
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
  const workspaces = await listWorkspaces();
  return workspaces.find((ws) => ws.subdomain === normalized) ?? null;
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
  const workspaces = await listWorkspaces();
  const index = workspaces.findIndex((ws) => ws.subdomain === normalized);
  if (index === -1) return;

  const current = workspaces[index];
  workspaces[index] = {
    ...current,
    madrasaName: branding.madrasaName.trim() || current.madrasaName,
    tagline: branding.tagline?.trim() || current.tagline,
  };
  await saveCollection(WORKSPACES_COLLECTION, workspaces);
}

export async function createWorkspace(data: {
  subdomain: string;
  madrasaName: string;
  tagline?: string;
  country?: string;
}): Promise<Workspace> {
  const subdomain = normalizeSubdomainInput(data.subdomain);
  await assertSubdomainAvailable(subdomain);

  const workspace: Workspace = {
    id: randomBytes(8).toString('hex'),
    subdomain,
    madrasaName: data.madrasaName,
    tagline: data.tagline,
    country: data.country,
    createdAt: new Date().toISOString(),
    enabled: true,
  };

  const workspaces = await listWorkspaces();
  workspaces.push(workspace);
  await saveCollection(WORKSPACES_COLLECTION, workspaces);
  return workspace;
}
