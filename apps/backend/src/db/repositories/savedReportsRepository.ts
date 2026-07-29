import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import type {
  GenericSavedReport,
  GenericSavedReportCategory,
  GenericSavedReportCreateInput,
} from '@mms/shared';
import { savedReports } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

export interface CreateSavedReportRecord extends GenericSavedReportCreateInput {
  createdBy: string;
  createdByName: string;
}

type SavedReportRow = typeof savedReports.$inferSelect;

function toGenericSavedReport(row: SavedReportRow): GenericSavedReport {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
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

export async function createSavedReportForOwner(
  workspaceSubdomain: string,
  input: CreateSavedReportRecord,
): Promise<GenericSavedReport> {
  const tenant = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();
  const values = {
    id: randomUUID(),
    workspaceSubdomain: tenant,
    category: input.category,
    name: input.name,
    filters: input.filters,
    lastRunAt: now,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    createdAt: now,
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
