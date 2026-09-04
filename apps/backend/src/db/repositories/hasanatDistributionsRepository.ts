import { and, eq, isNull, sql } from 'drizzle-orm';
import { type Distribution } from '@mms/shared';
import { hasanatDistributions } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type DistRow = typeof hasanatDistributions.$inferSelect;
export function distributionRowToRecord(row: DistRow): Distribution {
  const dist: Distribution = {
    id: row.id,
    batchId: row.batchId,
    denominationId: row.denominationId,
    denominationName: row.denominationName,
    recipientType: row.recipientType as Distribution['recipientType'],
    recipientName: row.recipientName ?? '',
    recipientClass: row.recipientClass,
    quantity: row.quantity,
    reason: row.reason,
    issuedDate: row.issuedDate,
    status: row.status as Distribution['status'],
  };

  if (row.recipientStudentId) dist.recipientStudentId = row.recipientStudentId;
  if (row.recipientTeacherId) dist.recipientTeacherId = row.recipientTeacherId;
  if (row.issuedByUserId) dist.issuedByUserId = row.issuedByUserId;
  if (row.issuedBy) dist.issuedBy = row.issuedBy;
  if (row.deletedAt) dist.deletedAt = row.deletedAt.toISOString();
  if (row.deletedBy) dist.deletedBy = row.deletedBy;
  if (row.deletionReason) dist.deletionReason = row.deletionReason;

  return dist;
}

export async function listDistributionsByWorkspace(tenant: string, options?: { limit?: number; offset?: number }): Promise<Distribution[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 1000, 1), 10000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: hasanatDistributions.id,
        workspaceSubdomain: hasanatDistributions.workspaceSubdomain,
        batchId: hasanatDistributions.batchId,
        denominationId: hasanatDistributions.denominationId,
        denominationName: hasanatDistributions.denominationName,
        recipientType: hasanatDistributions.recipientType,
        recipientStudentId: hasanatDistributions.recipientStudentId,
        recipientTeacherId: hasanatDistributions.recipientTeacherId,
        recipientName: hasanatDistributions.recipientName,
        recipientClass: hasanatDistributions.recipientClass,
        quantity: hasanatDistributions.quantity,
        reason: hasanatDistributions.reason,
        issuedDate: hasanatDistributions.issuedDate,
        issuedByUserId: hasanatDistributions.issuedByUserId,
        issuedBy: hasanatDistributions.issuedBy,
        status: hasanatDistributions.status,
        deletedAt: hasanatDistributions.deletedAt,
        deletedBy: hasanatDistributions.deletedBy,
        deletionReason: hasanatDistributions.deletionReason,
        createdAt: hasanatDistributions.createdAt,
        updatedAt: hasanatDistributions.updatedAt,
      })
      .from(hasanatDistributions)
      .where(
        and(
          eq(hasanatDistributions.workspaceSubdomain, subdomain),
          isNull(hasanatDistributions.deletedAt),
        ),
      )
      .limit(limit)
      .offset(offset);
    return rows.map(distributionRowToRecord);
  });
}

export async function findDistributionById(tenant: string, id: string): Promise<Distribution | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: hasanatDistributions.id,
        workspaceSubdomain: hasanatDistributions.workspaceSubdomain,
        batchId: hasanatDistributions.batchId,
        denominationId: hasanatDistributions.denominationId,
        denominationName: hasanatDistributions.denominationName,
        recipientType: hasanatDistributions.recipientType,
        recipientStudentId: hasanatDistributions.recipientStudentId,
        recipientTeacherId: hasanatDistributions.recipientTeacherId,
        recipientName: hasanatDistributions.recipientName,
        recipientClass: hasanatDistributions.recipientClass,
        quantity: hasanatDistributions.quantity,
        reason: hasanatDistributions.reason,
        issuedDate: hasanatDistributions.issuedDate,
        issuedByUserId: hasanatDistributions.issuedByUserId,
        issuedBy: hasanatDistributions.issuedBy,
        status: hasanatDistributions.status,
        deletedAt: hasanatDistributions.deletedAt,
        deletedBy: hasanatDistributions.deletedBy,
        deletionReason: hasanatDistributions.deletionReason,
        createdAt: hasanatDistributions.createdAt,
        updatedAt: hasanatDistributions.updatedAt,
      })
      .from(hasanatDistributions)
      .where(
        and(
          eq(hasanatDistributions.workspaceSubdomain, subdomain),
          eq(hasanatDistributions.id, id),
        ),
      )
      .limit(1);
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
    await tx
      .insert(hasanatDistributions)
      .values(
        records.map((r) => ({
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
        })),
      )
      .onConflictDoUpdate({
        target: [hasanatDistributions.workspaceSubdomain, hasanatDistributions.id],
        set: {
          batchId: sql`excluded.batch_id`,
          denominationId: sql`excluded.denomination_id`,
          denominationName: sql`excluded.denomination_name`,
          recipientType: sql`excluded.recipient_type`,
          recipientStudentId: sql`excluded.recipient_student_id`,
          recipientTeacherId: sql`excluded.recipient_teacher_id`,
          recipientName: sql`excluded.recipient_name`,
          recipientClass: sql`excluded.recipient_class`,
          quantity: sql`excluded.quantity`,
          reason: sql`excluded.reason`,
          issuedDate: sql`excluded.issued_date`,
          issuedByUserId: sql`excluded.issued_by_user_id`,
          issuedBy: sql`excluded.issued_by`,
          status: sql`excluded.status`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceDistributionsForWorkspace(tenant: string, records: Distribution[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(hasanatDistributions).where(eq(hasanatDistributions.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(hasanatDistributions).values(
        records.map((r) => ({
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
        })),
      );
    }
  });
}
