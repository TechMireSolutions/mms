import { eq } from 'drizzle-orm';
import { studentModulePreferences } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

export async function getStudentModulePreferencesByWorkspace(
  workspaceSubdomain: string,
): Promise<Record<string, unknown> | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(studentModulePreferences)
      .where(eq(studentModulePreferences.workspaceSubdomain, subdomain))
      .limit(1);
    const row = rows[0];
    return row?.preferences ?? null;
  });
}

export async function upsertStudentModulePreferences(
  workspaceSubdomain: string,
  preferences: Record<string, unknown>,
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .insert(studentModulePreferences)
      .values({
        workspaceSubdomain: subdomain,
        preferences,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: studentModulePreferences.workspaceSubdomain,
        set: { preferences, updatedAt: now },
      });
  });
}

export async function listAllStudentModulePreferencesByWorkspace(workspaceSubdomain: string) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    return tx
      .select()
      .from(studentModulePreferences)
      .where(eq(studentModulePreferences.workspaceSubdomain, subdomain));
  });
}

export async function replaceStudentModulePreferencesForWorkspace(
  workspaceSubdomain: string,
  records: Array<Record<string, unknown>>,
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .delete(studentModulePreferences)
      .where(eq(studentModulePreferences.workspaceSubdomain, subdomain));
    const first = records[0];
    if (!first) return;
    const preferences =
      first.preferences && typeof first.preferences === 'object' && !Array.isArray(first.preferences)
        ? (first.preferences as Record<string, unknown>)
        : (first as Record<string, unknown>);
    await tx.insert(studentModulePreferences).values({
      workspaceSubdomain: subdomain,
      preferences,
      updatedAt: now,
    });
  });
}
