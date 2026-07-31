import { and, eq } from 'drizzle-orm';
import { contactGoogleSyncCredentials } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

export interface ContactGoogleSyncCredentialRecord {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  updatedAt?: string;
}

type CredentialRow = typeof contactGoogleSyncCredentials.$inferSelect;

function toRecord(row: CredentialRow): ContactGoogleSyncCredentialRecord {
  return {
    clientId: row.clientId ?? undefined,
    clientSecret: row.clientSecret ?? undefined,
    accessToken: row.accessToken ?? undefined,
    refreshToken: row.refreshToken ?? undefined,
    updatedAt: row.updatedAt?.toISOString(),
  };
}

export async function findContactGoogleSyncCredentials(
  workspaceSubdomain: string,
  userId: string,
): Promise<ContactGoogleSyncCredentialRecord> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(tenant, async (tx) => {
    const rows = await tx
      .select()
      .from(contactGoogleSyncCredentials)
      .where(and(
        eq(contactGoogleSyncCredentials.workspaceSubdomain, tenant),
        eq(contactGoogleSyncCredentials.userId, userId),
      ))
      .limit(1);
    return rows[0] ? toRecord(rows[0]) : {};
  });
}

export async function upsertContactGoogleSyncCredentials(
  workspaceSubdomain: string,
  userId: string,
  config: ContactGoogleSyncCredentialRecord,
): Promise<ContactGoogleSyncCredentialRecord> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();
  const values = {
    workspaceSubdomain: tenant,
    userId,
    clientId: config.clientId ?? null,
    clientSecret: config.clientSecret ?? null,
    accessToken: config.accessToken ?? null,
    refreshToken: config.refreshToken ?? null,
    updatedAt: now,
  };

  return withTenantTransaction(tenant, async (tx) => {
    const rows = await tx
      .insert(contactGoogleSyncCredentials)
      .values(values)
      .onConflictDoUpdate({
        target: [
          contactGoogleSyncCredentials.workspaceSubdomain,
          contactGoogleSyncCredentials.userId,
        ],
        set: {
          clientId: values.clientId,
          clientSecret: values.clientSecret,
          accessToken: values.accessToken,
          refreshToken: values.refreshToken,
          updatedAt: now,
        },
      })
      .returning();
    return toRecord(rows[0]!);
  });
}

export async function deleteContactGoogleSyncCredentials(
  workspaceSubdomain: string,
  userId: string,
): Promise<void> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  await withTenantTransaction(tenant, async (tx) => {
    await tx
      .delete(contactGoogleSyncCredentials)
      .where(and(
        eq(contactGoogleSyncCredentials.workspaceSubdomain, tenant),
        eq(contactGoogleSyncCredentials.userId, userId),
      ));
  });
}

/** Admin/migration: replace every credential row for a workspace. */
export async function replaceContactGoogleSyncCredentialsForWorkspace(
  workspaceSubdomain: string,
  entries: Array<{ userId: string } & ContactGoogleSyncCredentialRecord>,
): Promise<void> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  await withTenantTransaction(tenant, async (tx) => {
    await tx
      .delete(contactGoogleSyncCredentials)
      .where(eq(contactGoogleSyncCredentials.workspaceSubdomain, tenant));
    if (entries.length === 0) return;
    const now = new Date();
    await tx.insert(contactGoogleSyncCredentials).values(
      entries.map((entry) => ({
        workspaceSubdomain: tenant,
        userId: entry.userId,
        clientId: entry.clientId ?? null,
        clientSecret: entry.clientSecret ?? null,
        accessToken: entry.accessToken ?? null,
        refreshToken: entry.refreshToken ?? null,
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : now,
      })),
    );
  });
}
