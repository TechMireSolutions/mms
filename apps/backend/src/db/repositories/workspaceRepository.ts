import { eq } from 'drizzle-orm';
import type { Workspace } from '@mms/shared';
import { getDb } from '../dbClient.js';
import { workspaces as workspacesTable } from '../schema.js';

function rowToWorkspace(ws: typeof workspacesTable.$inferSelect): Workspace {
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

export async function listWorkspaceRows(): Promise<Workspace[]> {
  const rows = await getDb().select().from(workspacesTable);
  return rows.map(rowToWorkspace);
}

export async function findWorkspaceRowBySubdomain(subdomain: string): Promise<Workspace | null> {
  const rows = await getDb()
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.subdomain, subdomain));
  const ws = rows[0];
  return ws ? rowToWorkspace(ws) : null;
}

export async function insertWorkspaceRow(values: {
  id: string;
  subdomain: string;
  madrasaName: string;
  tagline?: string | null;
  country?: string | null;
  enabled?: boolean;
}): Promise<void> {
  await getDb().insert(workspacesTable).values({
    id: values.id,
    subdomain: values.subdomain,
    madrasaName: values.madrasaName,
    tagline: values.tagline || null,
    country: values.country || null,
    enabled: values.enabled ?? true,
  });
}

export async function updateWorkspaceEnabledRow(subdomain: string, enabled: boolean): Promise<void> {
  await getDb()
    .update(workspacesTable)
    .set({ enabled })
    .where(eq(workspacesTable.subdomain, subdomain));
}

export async function updateWorkspaceBrandingRow(
  subdomain: string,
  branding: { madrasaName: string; tagline?: string | null },
): Promise<void> {
  await getDb()
    .update(workspacesTable)
    .set({
      madrasaName: branding.madrasaName.trim(),
      tagline: branding.tagline?.trim() || null,
    })
    .where(eq(workspacesTable.subdomain, subdomain));
}

export async function deleteWorkspaceRow(subdomain: string): Promise<void> {
  await getDb().delete(workspacesTable).where(eq(workspacesTable.subdomain, subdomain));
}
