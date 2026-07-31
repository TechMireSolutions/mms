import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import type {
  GenericSavedReport,
  GenericSavedReportCategory,
  GenericSavedReportCreateInput,
  PersistedSavedReportCategory,
} from '@mms/shared';
import { CONTACTS_SAVED_REPORT_CATEGORY } from '@mms/shared';
import { savedReports } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

export interface CreateSavedReportRecord extends GenericSavedReportCreateInput {
  createdBy: string;
  createdByName: string;
}

export interface CreatePersistedSavedReportRecord {
  id?: string;
  name: string;
  category: PersistedSavedReportCategory;
  filters: Record<string, unknown>;
  createdBy: string;
  createdByName: string;
  lastRunAt?: Date;
  createdAt?: Date;
}

type SavedReportRow = typeof savedReports.$inferSelect;

function toGenericSavedReport(row: SavedReportRow): GenericSavedReport {
  return {
    id: row.id,
    name: row.name,
    category: row.category as GenericSavedReport['category'],
    filters: row.filters,
    lastRun: row.lastRunAt.toISOString(),
    createdBy: row.createdBy,
    createdByName: row.createdByName,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listSavedReportsByOwner(
  workspaceSubdomain: string,
  category: GenericSavedReportCategory,
  createdBy: string,
): Promise<GenericSavedReport[]> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(tenant, async (tx) => {
    const rows = await tx
      .select()
      .from(savedReports)
      .where(and(
        eq(savedReports.workspaceSubdomain, tenant),
        eq(savedReports.category, category),
        eq(savedReports.createdBy, createdBy),
      ))
      .orderBy(desc(savedReports.createdAt));
    return rows.map(toGenericSavedReport);
  });
}

export async function listSavedReportsByCategory(
  workspaceSubdomain: string,
  category: PersistedSavedReportCategory,
): Promise<GenericSavedReport[]> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(tenant, async (tx) => {
    const rows = await tx
      .select()
      .from(savedReports)
      .where(and(
        eq(savedReports.workspaceSubdomain, tenant),
        eq(savedReports.category, category),
      ))
      .orderBy(desc(savedReports.createdAt));
    return rows.map(toGenericSavedReport);
  });
}

export async function findSavedReportByOwner(
  workspaceSubdomain: string,
  id: string,
  category: GenericSavedReportCategory,
  createdBy: string,
): Promise<GenericSavedReport | null> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(tenant, async (tx) => {
    const rows = await tx
      .select()
      .from(savedReports)
      .where(and(
        eq(savedReports.workspaceSubdomain, tenant),
        eq(savedReports.id, id),
        eq(savedReports.category, category),
        eq(savedReports.createdBy, createdBy),
      ))
      .limit(1);
    return rows[0] ? toGenericSavedReport(rows[0]) : null;
  });
}

export async function findSavedReportById(
  workspaceSubdomain: string,
  id: string,
  category: PersistedSavedReportCategory,
): Promise<GenericSavedReport | null> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(tenant, async (tx) => {
    const rows = await tx
      .select()
      .from(savedReports)
      .where(and(
        eq(savedReports.workspaceSubdomain, tenant),
        eq(savedReports.id, id),
        eq(savedReports.category, category),
      ))
      .limit(1);
    return rows[0] ? toGenericSavedReport(rows[0]) : null;
  });
}

export async function createSavedReportForOwner(
  workspaceSubdomain: string,
  input: CreateSavedReportRecord,
): Promise<GenericSavedReport> {
  return createPersistedSavedReport(workspaceSubdomain, input);
}

export async function createPersistedSavedReport(
  workspaceSubdomain: string,
  input: CreatePersistedSavedReportRecord,
): Promise<GenericSavedReport> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();
  const values = {
    id: input.id ?? randomUUID(),
    workspaceSubdomain: tenant,
    category: input.category,
    name: input.name,
    filters: input.filters,
    lastRunAt: input.lastRunAt ?? now,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };

  return withTenantTransaction(tenant, async (tx) => {
    const rows = await tx.insert(savedReports).values(values).returning();
    return toGenericSavedReport(rows[0]!);
  });
}

export async function deleteSavedReportByOwner(
  workspaceSubdomain: string,
  id: string,
  category: GenericSavedReportCategory,
  createdBy: string,
): Promise<boolean> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(tenant, async (tx) => {
    const rows = await tx
      .delete(savedReports)
      .where(and(
        eq(savedReports.workspaceSubdomain, tenant),
        eq(savedReports.id, id),
        eq(savedReports.category, category),
        eq(savedReports.createdBy, createdBy),
      ))
      .returning({ id: savedReports.id });
    return rows.length > 0;
  });
}

export async function deleteSavedReportById(
  workspaceSubdomain: string,
  id: string,
  category: PersistedSavedReportCategory,
): Promise<boolean> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(tenant, async (tx) => {
    const rows = await tx
      .delete(savedReports)
      .where(and(
        eq(savedReports.workspaceSubdomain, tenant),
        eq(savedReports.id, id),
        eq(savedReports.category, category),
      ))
      .returning({ id: savedReports.id });
    return rows.length > 0;
  });
}

export async function touchSavedReportRunByOwner(
  workspaceSubdomain: string,
  id: string,
  category: GenericSavedReportCategory,
  createdBy: string,
): Promise<GenericSavedReport | null> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();
  return withTenantTransaction(tenant, async (tx) => {
    const rows = await tx
      .update(savedReports)
      .set({ lastRunAt: now, updatedAt: now })
      .where(and(
        eq(savedReports.workspaceSubdomain, tenant),
        eq(savedReports.id, id),
        eq(savedReports.category, category),
        eq(savedReports.createdBy, createdBy),
      ))
      .returning();
    return rows[0] ? toGenericSavedReport(rows[0]) : null;
  });
}

export async function touchSavedReportRunById(
  workspaceSubdomain: string,
  id: string,
  category: PersistedSavedReportCategory,
): Promise<GenericSavedReport | null> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();
  return withTenantTransaction(tenant, async (tx) => {
    const rows = await tx
      .update(savedReports)
      .set({ lastRunAt: now, updatedAt: now })
      .where(and(
        eq(savedReports.workspaceSubdomain, tenant),
        eq(savedReports.id, id),
        eq(savedReports.category, category),
      ))
      .returning();
    return rows[0] ? toGenericSavedReport(rows[0]) : null;
  });
}

/** Every saved-report preset for a workspace — admin backup snapshots. */
export async function listAllSavedReportsByWorkspace(
  workspaceSubdomain: string,
): Promise<GenericSavedReport[]> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(tenant, async (tx) => {
    const rows = await tx
      .select()
      .from(savedReports)
      .where(eq(savedReports.workspaceSubdomain, tenant))
      .orderBy(desc(savedReports.createdAt));
    return rows.map(toGenericSavedReport);
  });
}

/** Wipe+replace saved-report presets — admin restore only. */
export async function replaceSavedReportsForWorkspace(
  workspaceSubdomain: string,
  reports: GenericSavedReport[],
): Promise<void> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  await withTenantTransaction(tenant, async (tx) => {
    await tx.delete(savedReports).where(eq(savedReports.workspaceSubdomain, tenant));
    if (reports.length === 0) return;

    const seen = new Set<string>();
    const values = [];
    for (const report of reports) {
      const id = String(report.id);
      if (seen.has(id)) continue;
      seen.add(id);
      const lastRunAt = new Date(report.lastRun);
      const createdAt = new Date(report.createdAt);
      values.push({
        id,
        workspaceSubdomain: tenant,
        category: report.category,
        name: report.name,
        filters: report.filters,
        lastRunAt: Number.isNaN(lastRunAt.getTime()) ? new Date() : lastRunAt,
        createdBy: report.createdBy,
        createdByName: report.createdByName,
        createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
        updatedAt: new Date(),
      });
    }
    if (values.length > 0) {
      await tx.insert(savedReports).values(values);
    }
  });
}

export { CONTACTS_SAVED_REPORT_CATEGORY };
