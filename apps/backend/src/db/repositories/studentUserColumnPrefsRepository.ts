import { and, eq } from 'drizzle-orm';
import { studentUserColumnPrefs } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

export async function getStudentUserColumnPrefs(
  workspaceSubdomain: string,
  userId: string,
): Promise<unknown[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const uid = userId.trim();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(studentUserColumnPrefs)
      .where(
        and(
          eq(studentUserColumnPrefs.workspaceSubdomain, subdomain),
          eq(studentUserColumnPrefs.userId, uid),
        ),
      )
      .limit(1);
    const row = rows[0];
    return Array.isArray(row?.preferences) ? row.preferences : [];
  });
}

export async function setStudentUserColumnPrefs(
  workspaceSubdomain: string,
  userId: string,
  preferences: unknown[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const uid = userId.trim();
  const now = new Date();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .insert(studentUserColumnPrefs)
      .values({
        workspaceSubdomain: subdomain,
        userId: uid,
        preferences,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [studentUserColumnPrefs.workspaceSubdomain, studentUserColumnPrefs.userId],
        set: { preferences, updatedAt: now },
      });
  });
}

export async function listAllStudentUserColumnPrefsByWorkspace(workspaceSubdomain: string) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    return tx
      .select()
      .from(studentUserColumnPrefs)
      .where(eq(studentUserColumnPrefs.workspaceSubdomain, subdomain));
  });
}

export async function replaceStudentUserColumnPrefsForWorkspace(
  workspaceSubdomain: string,
  records: Array<Record<string, unknown>>,
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .delete(studentUserColumnPrefs)
      .where(eq(studentUserColumnPrefs.workspaceSubdomain, subdomain));
    if (records.length === 0) return;
    await tx.insert(studentUserColumnPrefs).values(
      records.map((record) => ({
        workspaceSubdomain: subdomain,
        userId: String(record.userId ?? record.user_id ?? ''),
        preferences: Array.isArray(record.preferences) ? record.preferences : [],
        updatedAt: now,
      })),
    );
  });
}
