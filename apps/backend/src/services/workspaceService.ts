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
} from '@mms/shared';
import {
  getObject,
  purgeTenantDataBySubdomain,
  runInTransaction,
} from '../db/database.js';
import { getRequestTenant, runWithTenant } from '../lib/tenantContext.js';
import { getDb } from '../db/dbClient.js';
import { workspaces as workspacesTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function listWorkspaces(): Promise<Workspace[]> {
  const rows = await getDb().select().from(workspacesTable);
  return rows.map((ws) => ({
    id: ws.id,
    subdomain: ws.subdomain,
    madrasaName: ws.madrasaName,
    tagline: ws.tagline ?? undefined,
    country: ws.country ?? undefined,
    enabled: ws.enabled,
    createdAt: ws.createdAt.toISOString(),
  }));
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
    await getDb().delete(workspacesTable).where(eq(workspacesTable.subdomain, normalized));
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
    await getDb().update(workspacesTable)
      .set({ enabled })
      .where(eq(workspacesTable.subdomain, normalized));
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
  const rows = await getDb().select().from(workspacesTable).where(eq(workspacesTable.subdomain, normalized));
  const ws = rows[0];
  if (!ws) return null;
  return {
    id: ws.id,
    subdomain: ws.subdomain,
    madrasaName: ws.madrasaName,
    tagline: ws.tagline ?? undefined,
    country: ws.country ?? undefined,
    enabled: ws.enabled,
    createdAt: ws.createdAt.toISOString(),
  };
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
  await getDb().update(workspacesTable)
    .set({
      madrasaName: branding.madrasaName.trim(),
      tagline: branding.tagline?.trim() || null,
    })
    .where(eq(workspacesTable.subdomain, normalized));
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

    await getDb().insert(workspacesTable).values(newWs);

    return {
      ...newWs,
      tagline: newWs.tagline ?? undefined,
      country: newWs.country ?? undefined,
      createdAt: new Date().toISOString(),
    };
  });
}
