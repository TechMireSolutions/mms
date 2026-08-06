import { eq } from 'drizzle-orm';
import { studentFieldConfigs } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

export async function getStudentFieldConfigByWorkspace(
  workspaceSubdomain: string,
): Promise<Record<string, unknown> | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(studentFieldConfigs)
      .where(eq(studentFieldConfigs.workspaceSubdomain, subdomain))
      .limit(1);
    const row = rows[0];
    return row?.config ?? null;
  });
}

export async function upsertStudentFieldConfig(
  workspaceSubdomain: string,
  config: Record<string, unknown>,
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .insert(studentFieldConfigs)
      .values({
        workspaceSubdomain: subdomain,
        config,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: studentFieldConfigs.workspaceSubdomain,
        set: { config, updatedAt: now },
      });
  });
}

/** Admin backup snapshot — zero or one row as array. */
export async function listAllStudentFieldConfigsByWorkspace(workspaceSubdomain: string) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    return tx
      .select()
      .from(studentFieldConfigs)
      .where(eq(studentFieldConfigs.workspaceSubdomain, subdomain));
  });
}

export async function replaceStudentFieldConfigsForWorkspace(
  workspaceSubdomain: string,
  records: Array<Record<string, unknown>>,
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(studentFieldConfigs).where(eq(studentFieldConfigs.workspaceSubdomain, subdomain));
    const first = records[0];
    if (!first) return;
    const config =
      first.config && typeof first.config === 'object' && !Array.isArray(first.config)
        ? (first.config as Record<string, unknown>)
        : (first as Record<string, unknown>);
    await tx.insert(studentFieldConfigs).values({
      workspaceSubdomain: subdomain,
      config,
      updatedAt: now,
    });
  });
}
