import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { dedupeTrimmedIds, type FiscalYear } from '@mms/shared';
import { accountingFiscalYears } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type FiscalYearRow = typeof accountingFiscalYears.$inferSelect;

export function fiscalYearRowToRecord(row: FiscalYearRow): FiscalYear {
  const fiscalYear: FiscalYear = {
    id: row.id,
    label: row.label,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status as FiscalYear['status'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  if (row.closedAt) fiscalYear.closedAt = row.closedAt.toISOString();
  if (row.closedBy) fiscalYear.closedBy = row.closedBy;
  if (row.deletedAt) fiscalYear.deletedAt = row.deletedAt.toISOString();
  if (row.deletedBy) fiscalYear.deletedBy = row.deletedBy;
  if (row.deletionReason) fiscalYear.deletionReason = row.deletionReason;

  return fiscalYear;
}

export async function listFiscalYearsByWorkspace(tenant: string): Promise<FiscalYear[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: accountingFiscalYears.id,
        workspaceSubdomain: accountingFiscalYears.workspaceSubdomain,
        label: accountingFiscalYears.label,
        startDate: accountingFiscalYears.startDate,
        endDate: accountingFiscalYears.endDate,
        status: accountingFiscalYears.status,
        closedAt: accountingFiscalYears.closedAt,
        closedBy: accountingFiscalYears.closedBy,
        deletedAt: accountingFiscalYears.deletedAt,
        deletedBy: accountingFiscalYears.deletedBy,
        deletionReason: accountingFiscalYears.deletionReason,
        createdAt: accountingFiscalYears.createdAt,
        updatedAt: accountingFiscalYears.updatedAt,
      })
      .from(accountingFiscalYears)
      .where(and(eq(accountingFiscalYears.workspaceSubdomain, subdomain), isNull(accountingFiscalYears.deletedAt)));
    return rows.map(fiscalYearRowToRecord);
  });
}

export async function findFiscalYearById(tenant: string, id: string): Promise<FiscalYear | null> {
  const trimmedId = id?.trim();
  if (!trimmedId) return null;
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: accountingFiscalYears.id,
        workspaceSubdomain: accountingFiscalYears.workspaceSubdomain,
        label: accountingFiscalYears.label,
        startDate: accountingFiscalYears.startDate,
        endDate: accountingFiscalYears.endDate,
        status: accountingFiscalYears.status,
        closedAt: accountingFiscalYears.closedAt,
        closedBy: accountingFiscalYears.closedBy,
        deletedAt: accountingFiscalYears.deletedAt,
        deletedBy: accountingFiscalYears.deletedBy,
        deletionReason: accountingFiscalYears.deletionReason,
        createdAt: accountingFiscalYears.createdAt,
        updatedAt: accountingFiscalYears.updatedAt,
      })
      .from(accountingFiscalYears)
      .where(and(eq(accountingFiscalYears.workspaceSubdomain, subdomain), eq(accountingFiscalYears.id, trimmedId)))
      .limit(1);
    const row = rows[0];
    return row ? fiscalYearRowToRecord(row) : null;
  });
}

export async function findFiscalYearsByIds(tenant: string, ids: string[]): Promise<FiscalYear[]> {
  const cleanIds = dedupeTrimmedIds(ids);
  if (cleanIds.length === 0) return [];
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: accountingFiscalYears.id,
        workspaceSubdomain: accountingFiscalYears.workspaceSubdomain,
        label: accountingFiscalYears.label,
        startDate: accountingFiscalYears.startDate,
        endDate: accountingFiscalYears.endDate,
        status: accountingFiscalYears.status,
        closedAt: accountingFiscalYears.closedAt,
        closedBy: accountingFiscalYears.closedBy,
        deletedAt: accountingFiscalYears.deletedAt,
        deletedBy: accountingFiscalYears.deletedBy,
        deletionReason: accountingFiscalYears.deletionReason,
        createdAt: accountingFiscalYears.createdAt,
        updatedAt: accountingFiscalYears.updatedAt,
      })
      .from(accountingFiscalYears)
      .where(
        and(
          eq(accountingFiscalYears.workspaceSubdomain, subdomain),
          inArray(accountingFiscalYears.id, cleanIds),
        ),
      );
    return rows.map(fiscalYearRowToRecord);
  });
}

export async function saveFiscalYear(tenant: string, record: FiscalYear): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(accountingFiscalYears)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        label: record.label,
        startDate: record.startDate,
        endDate: record.endDate,
        status: record.status ?? 'upcoming',
        closedAt: record.closedAt ? new Date(record.closedAt) : null,
        closedBy: record.closedBy ?? null,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [accountingFiscalYears.workspaceSubdomain, accountingFiscalYears.id],
        set: {
          label: record.label,
          startDate: record.startDate,
          endDate: record.endDate,
          status: record.status ?? 'upcoming',
          closedAt: record.closedAt ? new Date(record.closedAt) : null,
          closedBy: record.closedBy ?? null,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        },
      });
  });
}

export async function bulkSaveFiscalYears(tenant: string, records: FiscalYear[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  const uniqueMap = new Map<string, FiscalYear>();
  for (const r of records) {
    const cleanId = typeof r.id === 'string' ? r.id.trim() : String(r.id);
    if (cleanId) uniqueMap.set(cleanId, { ...r, id: cleanId });
  }
  const uniqueRecords = Array.from(uniqueMap.values());
  if (uniqueRecords.length === 0) return;

  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(accountingFiscalYears)
      .values(
        uniqueRecords.map((r) => ({
          id: r.id,
          workspaceSubdomain: subdomain,
          label: r.label,
          startDate: r.startDate,
          endDate: r.endDate,
          status: r.status ?? 'upcoming',
          closedAt: r.closedAt ? new Date(r.closedAt) : null,
          closedBy: r.closedBy ?? null,
          deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
          deletedBy: r.deletedBy ?? null,
          deletionReason: r.deletionReason ?? null,
          updatedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [accountingFiscalYears.workspaceSubdomain, accountingFiscalYears.id],
        set: {
          label: sql`excluded.label`,
          startDate: sql`excluded.start_date`,
          endDate: sql`excluded.end_date`,
          status: sql`excluded.status`,
          closedAt: sql`excluded.closed_at`,
          closedBy: sql`excluded.closed_by`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceFiscalYearsForWorkspace(tenant: string, records: FiscalYear[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  const uniqueMap = new Map<string, FiscalYear>();
  for (const r of records) {
    const cleanId = typeof r.id === 'string' ? r.id.trim() : String(r.id);
    if (cleanId) uniqueMap.set(cleanId, { ...r, id: cleanId });
  }
  const uniqueRecords = Array.from(uniqueMap.values());

  await withTenant(subdomain, async (tx) => {
    await tx.delete(accountingFiscalYears).where(eq(accountingFiscalYears.workspaceSubdomain, subdomain));
    if (uniqueRecords.length > 0) {
      await tx.insert(accountingFiscalYears).values(
        uniqueRecords.map((r) => ({
          id: r.id,
          workspaceSubdomain: subdomain,
          label: r.label,
          startDate: r.startDate,
          endDate: r.endDate,
          status: r.status ?? 'upcoming',
          closedAt: r.closedAt ? new Date(r.closedAt) : null,
          closedBy: r.closedBy ?? null,
          deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
          deletedBy: r.deletedBy ?? null,
          deletionReason: r.deletionReason ?? null,
          updatedAt: new Date(),
        })),
      );
    }
  });
}
