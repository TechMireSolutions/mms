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
