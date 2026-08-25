import { and, eq, isNull } from 'drizzle-orm';
import { type FiscalYear } from '@mms/shared';
import { accountingFiscalYears } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type FiscalYearRow = typeof accountingFiscalYears.$inferSelect;

export function fiscalYearRowToRecord(row: FiscalYearRow): FiscalYear {
  return {
    id: row.id,
    label: row.label,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status as FiscalYear['status'],
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listFiscalYearsByWorkspace(tenant: string): Promise<FiscalYear[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(accountingFiscalYears)
      .where(and(eq(accountingFiscalYears.workspaceSubdomain, subdomain), isNull(accountingFiscalYears.deletedAt)));
    return rows.map(fiscalYearRowToRecord);
  });
}

export async function findFiscalYearById(tenant: string, id: string): Promise<FiscalYear | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(accountingFiscalYears)
      .where(and(eq(accountingFiscalYears.workspaceSubdomain, subdomain), eq(accountingFiscalYears.id, id)));
    const row = rows[0];
    return row ? fiscalYearRowToRecord(row) : null;
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
  await withTenant(subdomain, async (tx) => {
    for (const r of records) {
      await tx
        .insert(accountingFiscalYears)
        .values({
          id: r.id,
          workspaceSubdomain: subdomain,
          label: r.label,
          startDate: r.startDate,
          endDate: r.endDate,
          status: r.status ?? 'upcoming',
          deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
          deletedBy: r.deletedBy ?? null,
          deletionReason: r.deletionReason ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [accountingFiscalYears.workspaceSubdomain, accountingFiscalYears.id],
          set: {
            label: r.label,
            startDate: r.startDate,
            endDate: r.endDate,
            status: r.status ?? 'upcoming',
            deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
            deletedBy: r.deletedBy ?? null,
            deletionReason: r.deletionReason ?? null,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceFiscalYearsForWorkspace(tenant: string, records: FiscalYear[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(accountingFiscalYears).where(eq(accountingFiscalYears.workspaceSubdomain, subdomain));
    for (const r of records) {
      await tx.insert(accountingFiscalYears).values({
        id: r.id,
        workspaceSubdomain: subdomain,
        label: r.label,
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status ?? 'upcoming',
        deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
        deletedBy: r.deletedBy ?? null,
        deletionReason: r.deletionReason ?? null,
        updatedAt: new Date(),
      });
    }
  });
}
