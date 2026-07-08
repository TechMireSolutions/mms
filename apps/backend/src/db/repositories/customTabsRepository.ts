import { and, eq } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import { customTabs } from '../schema.js';

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
  const db = getDb();
  
  if (moduleId) {
    return db
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

  return db
    .select()
    .from(customTabs)
    .where(eq(customTabs.workspaceSubdomain, subdomain))
    .orderBy(customTabs.sortOrder);
}

export async function findCustomTabById(
  workspaceSubdomain: string,
  id: string
) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(customTabs)
    .where(
      and(
        eq(customTabs.workspaceSubdomain, subdomain),
        eq(customTabs.id, id)
      )
    );
  return rows[0] || null;
}

export async function saveCustomTabRow(
  workspaceSubdomain: string,
  tab: CustomTabDbInput
) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  
  const existing = await db
    .select({ id: customTabs.id })
    .from(customTabs)
    .where(
      and(
        eq(customTabs.workspaceSubdomain, subdomain),
        eq(customTabs.id, tab.id)
      )
    );

  const values = {
    ...tab,
    workspaceSubdomain: subdomain,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db
      .update(customTabs)
      .set(values)
      .where(
        and(
          eq(customTabs.workspaceSubdomain, subdomain),
          eq(customTabs.id, tab.id)
        )
      );
  } else {
    await db.insert(customTabs).values(values);
  }
}

export async function deleteCustomTabRow(
  workspaceSubdomain: string,
  id: string
) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(customTabs)
    .where(
      and(
        eq(customTabs.workspaceSubdomain, subdomain),
        eq(customTabs.id, id)
      )
    );
}

export async function replaceCustomTabsForModule(
  workspaceSubdomain: string,
  moduleId: string,
  tabs: Omit<CustomTabDbInput, 'id' | 'workspaceSubdomain' | 'moduleId'>[]
) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();

  await db
    .delete(customTabs)
    .where(
      and(
        eq(customTabs.workspaceSubdomain, subdomain),
        eq(customTabs.moduleId, moduleId)
      )
    );

  if (tabs.length === 0) return;

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

  await db.insert(customTabs).values(values);
}
