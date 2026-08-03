import { and, eq } from 'drizzle-orm';
import { contactUserColumnPrefs } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

export async function getContactUserColumnPrefs(
  workspaceSubdomain: string,
  userId: string,
): Promise<unknown[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const uid = userId.trim();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(contactUserColumnPrefs)
      .where(
        and(
          eq(contactUserColumnPrefs.workspaceSubdomain, subdomain),
          eq(contactUserColumnPrefs.userId, uid),
        ),
      )
      .limit(1);
    const row = rows[0];
    return Array.isArray(row?.preferences) ? row.preferences : [];
  });
}

export async function setContactUserColumnPrefs(
  workspaceSubdomain: string,
  userId: string,
  preferences: unknown[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const uid = userId.trim();
  const now = new Date();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .insert(contactUserColumnPrefs)
      .values({
        workspaceSubdomain: subdomain,
        userId: uid,
        preferences,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [contactUserColumnPrefs.workspaceSubdomain, contactUserColumnPrefs.userId],
        set: { preferences, updatedAt: now },
      });
  });
}

export async function listAllContactUserColumnPrefsByWorkspace(workspaceSubdomain: string) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    return tx
      .select()
      .from(contactUserColumnPrefs)
      .where(eq(contactUserColumnPrefs.workspaceSubdomain, subdomain));
  });
}

export async function replaceContactUserColumnPrefsForWorkspace(
  workspaceSubdomain: string,
  records: Array<Record<string, unknown>>,
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .delete(contactUserColumnPrefs)
      .where(eq(contactUserColumnPrefs.workspaceSubdomain, subdomain));
    if (records.length === 0) return;
    await tx.insert(contactUserColumnPrefs).values(
      records.map((record) => ({
        workspaceSubdomain: subdomain,
        userId: String(record.userId ?? record.user_id ?? ''),
        preferences: Array.isArray(record.preferences) ? record.preferences : [],
        updatedAt: now,
      })),
    );
  });
}
