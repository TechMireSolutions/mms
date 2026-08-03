import { eq } from 'drizzle-orm';
import { contactModulePreferences } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

export async function getContactModulePreferencesByWorkspace(
  workspaceSubdomain: string,
): Promise<Record<string, unknown> | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(contactModulePreferences)
      .where(eq(contactModulePreferences.workspaceSubdomain, subdomain))
      .limit(1);
    const row = rows[0];
    return row?.preferences ?? null;
  });
}

export async function upsertContactModulePreferences(
  workspaceSubdomain: string,
  preferences: Record<string, unknown>,
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .insert(contactModulePreferences)
      .values({
        workspaceSubdomain: subdomain,
        preferences,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: contactModulePreferences.workspaceSubdomain,
        set: { preferences, updatedAt: now },
      });
  });
}

export async function listAllContactModulePreferencesByWorkspace(workspaceSubdomain: string) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    return tx
      .select()
      .from(contactModulePreferences)
      .where(eq(contactModulePreferences.workspaceSubdomain, subdomain));
  });
}

export async function replaceContactModulePreferencesForWorkspace(
  workspaceSubdomain: string,
  records: Array<Record<string, unknown>>,
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .delete(contactModulePreferences)
      .where(eq(contactModulePreferences.workspaceSubdomain, subdomain));
    const first = records[0];
    if (!first) return;
    const preferences =
      first.preferences && typeof first.preferences === 'object' && !Array.isArray(first.preferences)
        ? (first.preferences as Record<string, unknown>)
        : (first as Record<string, unknown>);
    await tx.insert(contactModulePreferences).values({
      workspaceSubdomain: subdomain,
      preferences,
      updatedAt: now,
    });
  });
}
