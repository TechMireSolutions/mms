import { and, eq, isNull, sql } from 'drizzle-orm';
import { type Account } from '@mms/shared';
import { accountingAccounts } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type AccountRow = typeof accountingAccounts.$inferSelect;

export function accountRowToRecord(row: AccountRow): Account {
  const account: Account = {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type as Account['type'],
    subtype: row.subtype,
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  if (row.deletedAt) account.deletedAt = row.deletedAt.toISOString();
  if (row.deletedBy) account.deletedBy = row.deletedBy;
  if (row.deletionReason) account.deletionReason = row.deletionReason;

  return account;
}

export async function listAccountsByWorkspace(tenant: string): Promise<Account[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: accountingAccounts.id,
        workspaceSubdomain: accountingAccounts.workspaceSubdomain,
        code: accountingAccounts.code,
        name: accountingAccounts.name,
        type: accountingAccounts.type,
        subtype: accountingAccounts.subtype,
        description: accountingAccounts.description,
        isActive: accountingAccounts.isActive,
        deletedAt: accountingAccounts.deletedAt,
        deletedBy: accountingAccounts.deletedBy,
        deletionReason: accountingAccounts.deletionReason,
        createdAt: accountingAccounts.createdAt,
        updatedAt: accountingAccounts.updatedAt,
      })
      .from(accountingAccounts)
      .where(and(eq(accountingAccounts.workspaceSubdomain, subdomain), isNull(accountingAccounts.deletedAt)));
    return rows.map(accountRowToRecord);
  });
}

export async function findAccountById(tenant: string, id: string): Promise<Account | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: accountingAccounts.id,
        workspaceSubdomain: accountingAccounts.workspaceSubdomain,
        code: accountingAccounts.code,
        name: accountingAccounts.name,
        type: accountingAccounts.type,
        subtype: accountingAccounts.subtype,
        description: accountingAccounts.description,
        isActive: accountingAccounts.isActive,
        deletedAt: accountingAccounts.deletedAt,
        deletedBy: accountingAccounts.deletedBy,
        deletionReason: accountingAccounts.deletionReason,
        createdAt: accountingAccounts.createdAt,
        updatedAt: accountingAccounts.updatedAt,
      })
      .from(accountingAccounts)
      .where(and(eq(accountingAccounts.workspaceSubdomain, subdomain), eq(accountingAccounts.id, id)))
      .limit(1);
    const row = rows[0];
    return row ? accountRowToRecord(row) : null;
  });
}

export async function saveAccount(tenant: string, record: Account): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(accountingAccounts)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        code: record.code,
        name: record.name,
        type: record.type,
        subtype: record.subtype ?? '',
        description: record.description ?? '',
        isActive: record.isActive ?? true,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [accountingAccounts.workspaceSubdomain, accountingAccounts.id],
        set: {
          code: record.code,
          name: record.name,
          type: record.type,
          subtype: record.subtype ?? '',
          description: record.description ?? '',
          isActive: record.isActive ?? true,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        },
      });
  });
}

export async function bulkSaveAccounts(tenant: string, records: Account[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(accountingAccounts)
      .values(
        records.map((r) => ({
          id: r.id,
          workspaceSubdomain: subdomain,
          code: r.code,
          name: r.name,
          type: r.type,
          subtype: r.subtype ?? '',
          description: r.description ?? '',
          isActive: r.isActive ?? true,
          deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
          deletedBy: r.deletedBy ?? null,
          deletionReason: r.deletionReason ?? null,
          updatedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [accountingAccounts.workspaceSubdomain, accountingAccounts.id],
        set: {
          code: sql`excluded.code`,
          name: sql`excluded.name`,
          type: sql`excluded.type`,
          subtype: sql`excluded.subtype`,
          description: sql`excluded.description`,
          isActive: sql`excluded.is_active`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceAccountsForWorkspace(tenant: string, records: Account[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(accountingAccounts).where(eq(accountingAccounts.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(accountingAccounts).values(
        records.map((r) => ({
          id: r.id,
          workspaceSubdomain: subdomain,
          code: r.code,
          name: r.name,
          type: r.type,
          subtype: r.subtype ?? '',
          description: r.description ?? '',
          isActive: r.isActive ?? true,
          deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
          deletedBy: r.deletedBy ?? null,
          deletionReason: r.deletionReason ?? null,
          updatedAt: new Date(),
        })),
      );
    }
  });
}
