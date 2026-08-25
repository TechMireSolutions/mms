import { and, eq, isNull } from 'drizzle-orm';
import { type Distribution } from '@mms/shared';
import { hasanatDistributions } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type DistRow = typeof hasanatDistributions.$inferSelect;
export function distributionRowToRecord(row: DistRow): Distribution {
  return {
    id: row.id,
    batchId: row.batchId,
    denominationId: row.denominationId,
    denominationName: row.denominationName,
    recipientType: row.recipientType as Distribution['recipientType'],
    recipientStudentId: row.recipientStudentId ?? undefined,
    recipientTeacherId: row.recipientTeacherId ?? undefined,
    recipientName: row.recipientName ?? undefined,
    recipientClass: row.recipientClass,
    quantity: row.quantity,
    reason: row.reason,
    issuedDate: row.issuedDate,
    issuedByUserId: row.issuedByUserId ?? undefined,
    issuedBy: row.issuedBy ?? undefined,
    status: row.status as Distribution['status'],
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
  };
}

export async function listDistributionsByWorkspace(tenant: string): Promise<Distribution[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(hasanatDistributions)
      .where(
        and(
          eq(hasanatDistributions.workspaceSubdomain, subdomain),
          isNull(hasanatDistributions.deletedAt),
        ),
      );
    return rows.map(distributionRowToRecord);
  });
}

export async function findDistributionById(tenant: string, id: string): Promise<Distribution | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(hasanatDistributions)
      .where(
        and(
          eq(hasanatDistributions.workspaceSubdomain, subdomain),
          eq(hasanatDistributions.id, id),
        ),
      );
    const row = rows[0];
    return row ? distributionRowToRecord(row) : null;
  });
}

export async function saveDistribution(tenant: string, record: Distribution): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(hasanatDistributions)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        batchId: record.batchId,
        denominationId: record.denominationId,
        denominationName: record.denominationName ?? '',
        recipientType: record.recipientType ?? 'student',
        recipientStudentId: record.recipientStudentId ?? null,
        recipientTeacherId: record.recipientTeacherId ?? null,
        recipientName: record.recipientName ?? '',
        recipientClass: record.recipientClass ?? '',
        quantity: record.quantity ?? 1,
        reason: record.reason ?? '',
        issuedDate: record.issuedDate,
        issuedByUserId: record.issuedByUserId ?? null,
        issuedBy: record.issuedBy ?? null,
        status: record.status ?? 'active',
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [hasanatDistributions.workspaceSubdomain, hasanatDistributions.id],
        set: {
          batchId: record.batchId,
          denominationId: record.denominationId,
          denominationName: record.denominationName ?? '',
          recipientType: record.recipientType ?? 'student',
          recipientStudentId: record.recipientStudentId ?? null,
          recipientTeacherId: record.recipientTeacherId ?? null,
          recipientName: record.recipientName ?? '',
          recipientClass: record.recipientClass ?? '',
          quantity: record.quantity ?? 1,
          reason: record.reason ?? '',
          issuedDate: record.issuedDate,
          issuedByUserId: record.issuedByUserId ?? null,
          issuedBy: record.issuedBy ?? null,
          status: record.status ?? 'active',
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        },
      });
  });
}

export async function bulkSaveDistributions(tenant: string, records: Distribution[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const r of records) {
      await tx
        .insert(hasanatDistributions)
        .values({
          id: r.id,
          workspaceSubdomain: subdomain,
          batchId: r.batchId,
          denominationId: r.denominationId,
          denominationName: r.denominationName ?? '',
          recipientType: r.recipientType ?? 'student',
          recipientStudentId: r.recipientStudentId ?? null,
          recipientTeacherId: r.recipientTeacherId ?? null,
          recipientName: r.recipientName ?? '',
          recipientClass: r.recipientClass ?? '',
          quantity: r.quantity ?? 1,
          reason: r.reason ?? '',
          issuedDate: r.issuedDate,
          issuedByUserId: r.issuedByUserId ?? null,
          issuedBy: r.issuedBy ?? null,
          status: r.status ?? 'active',
          deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
          deletedBy: r.deletedBy ?? null,
          deletionReason: r.deletionReason ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [hasanatDistributions.workspaceSubdomain, hasanatDistributions.id],
          set: {
            batchId: r.batchId,
            denominationId: r.denominationId,
            denominationName: r.denominationName ?? '',
            recipientType: r.recipientType ?? 'student',
            recipientStudentId: r.recipientStudentId ?? null,
            recipientTeacherId: r.recipientTeacherId ?? null,
            recipientName: r.recipientName ?? '',
            recipientClass: r.recipientClass ?? '',
            quantity: r.quantity ?? 1,
            reason: r.reason ?? '',
            issuedDate: r.issuedDate,
            issuedByUserId: r.issuedByUserId ?? null,
            issuedBy: r.issuedBy ?? null,
            status: r.status ?? 'active',
            deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
            deletedBy: r.deletedBy ?? null,
            deletionReason: r.deletionReason ?? null,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceDistributionsForWorkspace(tenant: string, records: Distribution[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(hasanatDistributions).where(eq(hasanatDistributions.workspaceSubdomain, subdomain));
    for (const r of records) {
      await tx.insert(hasanatDistributions).values({
        id: r.id,
        workspaceSubdomain: subdomain,
        batchId: r.batchId,
        denominationId: r.denominationId,
        denominationName: r.denominationName ?? '',
        recipientType: r.recipientType ?? 'student',
        recipientStudentId: r.recipientStudentId ?? null,
        recipientTeacherId: r.recipientTeacherId ?? null,
        recipientName: r.recipientName ?? '',
        recipientClass: r.recipientClass ?? '',
        quantity: r.quantity ?? 1,
        reason: r.reason ?? '',
        issuedDate: r.issuedDate,
        issuedByUserId: r.issuedByUserId ?? null,
        issuedBy: r.issuedBy ?? null,
        status: r.status ?? 'active',
        deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
        deletedBy: r.deletedBy ?? null,
        deletionReason: r.deletionReason ?? null,
        updatedAt: new Date(),
      });
    }
  });
}
