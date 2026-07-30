import { and, eq, sql } from 'drizzle-orm';
import { customTabs } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

export interface CustomTabDbInput {
  id: string;
  workspaceSubdomain: string;
  moduleId: string;
  key: string;
  label: string;
  icon?: string | null;
  enabled?: boolean;
  sortOrder?: number;
  permissions?: string[] | null;
  description?: string | null;
  color?: string | null;
  isSystem?: boolean;
}

export async function listCustomTabsByWorkspace(
  workspaceSubdomain: string,
  moduleId?: string
) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();

  return withTenantTransaction(subdomain, async (tx) => {
    if (moduleId) {
      return tx
        .select()
        .from(customTabs)
        .where(
          and(
            eq(customTabs.workspaceSubdomain, subdomain),
            eq(customTabs.moduleId, moduleId)
          )
        )
        .orderBy(customTabs.sortOrder);
    }

    return tx
      .select()
      .from(customTabs)
      .where(eq(customTabs.workspaceSubdomain, subdomain))
      .orderBy(customTabs.sortOrder);
  });
}

export async function findCustomTabById(
  workspaceSubdomain: string,
  id: string
) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(customTabs)
      .where(
        and(
          eq(customTabs.workspaceSubdomain, subdomain),
          eq(customTabs.id, id)
        )
      );
    return rows[0] || null;
  });
}

export async function saveCustomTabRow(
  workspaceSubdomain: string,
  tab: CustomTabDbInput
) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const values = {
    ...tab,
    workspaceSubdomain: subdomain,
    updatedAt: new Date(),
  };

  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .insert(customTabs)
      .values(values)
      .onConflictDoUpdate({
        target: [customTabs.workspaceSubdomain, customTabs.id],
        set: {
          key: sql`excluded.key`,
          label: sql`excluded.label`,
          icon: sql`excluded.icon`,
          enabled: sql`excluded.enabled`,
          sortOrder: sql`excluded.sort_order`,
          permissions: sql`excluded.permissions`,
          description: sql`excluded.description`,
          color: sql`excluded.color`,
          isSystem: sql`excluded.is_system`,
          moduleId: sql`excluded.module_id`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  });
}

export async function deleteCustomTabRow(
  workspaceSubdomain: string,
  id: string
) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .delete(customTabs)
      .where(
        and(
          eq(customTabs.workspaceSubdomain, subdomain),
          eq(customTabs.id, id)
        )
      );
  });
}

/** Backup-friendly custom tab rows (workspace-scoped, no internal PK remapping). */
export interface CustomTabBackupRow {
  id: string;
  moduleId: string;
  key: string;
  label: string;
  icon?: string | null;
  enabled?: boolean;
  sortOrder?: number;
  permissions?: string[] | null;
  description?: string | null;
  color?: string | null;
  isSystem?: boolean;
}

/** Every custom tab for a workspace — admin backup snapshots. */
export async function listAllCustomTabsByWorkspace(
  workspaceSubdomain: string,
): Promise<CustomTabBackupRow[]> {
  const rows = await listCustomTabsByWorkspace(workspaceSubdomain);
  return rows.map((row) => ({
    id: row.id,
    moduleId: row.moduleId,
    key: row.key,
    label: row.label,
    icon: row.icon,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    permissions: (row.permissions as string[] | null) ?? null,
    description: row.description,
    color: row.color,
    isSystem: row.isSystem,
  }));
}

/** Wipe+replace custom tabs — admin restore only. */
export async function replaceCustomTabsForWorkspace(
  workspaceSubdomain: string,
  tabs: CustomTabBackupRow[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(customTabs).where(eq(customTabs.workspaceSubdomain, subdomain));
    if (tabs.length === 0) return;

    const seen = new Set<string>();
    const values = [];
    for (const [index, tab] of tabs.entries()) {
      const moduleId = String(tab.moduleId || '').trim();
      const key = String(tab.key || '').trim();
      if (!moduleId || !key) continue;
      const id = String(tab.id || `${subdomain}:${moduleId}:${key}`);
      if (seen.has(id)) continue;
      seen.add(id);
      values.push({
        id,
        workspaceSubdomain: subdomain,
        moduleId,
        key,
        label: String(tab.label || key),
        icon: tab.icon ?? null,
        enabled: tab.enabled !== false,
        sortOrder: tab.sortOrder ?? index,
        permissions: tab.permissions ?? null,
        description: tab.description ?? null,
        color: tab.color ?? null,
        isSystem: tab.isSystem === true,
        updatedAt: new Date(),
      });
    }
    if (values.length > 0) {
      await tx.insert(customTabs).values(values);
    }
  });
}

/** Upsert tabs for a module — never wipe rows absent from the payload. */
export async function bulkUpsertCustomTabsForModule(
  workspaceSubdomain: string,
  moduleId: string,
  tabs: Omit<CustomTabDbInput, 'id' | 'workspaceSubdomain' | 'moduleId'>[]
) {
  if (tabs.length === 0) return;

  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const values = tabs.map((tab, idx) => ({
    ...tab,
    id: `${subdomain}:${moduleId}:${tab.key}`,
    workspaceSubdomain: subdomain,
    moduleId,
    sortOrder: tab.sortOrder ?? idx,
    enabled: tab.enabled !== false,
    isSystem: tab.isSystem === true,
    updatedAt: new Date(),
  }));

  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .insert(customTabs)
      .values(values)
      .onConflictDoUpdate({
        target: [customTabs.workspaceSubdomain, customTabs.id],
        set: {
          key: sql`excluded.key`,
          label: sql`excluded.label`,
          icon: sql`excluded.icon`,
          enabled: sql`excluded.enabled`,
          sortOrder: sql`excluded.sort_order`,
          permissions: sql`excluded.permissions`,
          description: sql`excluded.description`,
          color: sql`excluded.color`,
          isSystem: sql`excluded.is_system`,
          moduleId: sql`excluded.module_id`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  });
}
