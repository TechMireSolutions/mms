import { and, eq, isNull } from 'drizzle-orm';
import {
  type Denomination,
  type StockBatch,
  type Distribution,
  type Redemption,
} from '@mms/shared';
import {
  hasanatDenoms,
  hasanatBatches,
  hasanatDistributions,
  hasanatRedemptions,
} from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

// --- Denominations ---

type DenomRow = typeof hasanatDenoms.$inferSelect;
function denomRowToRecord(row: DenomRow): Denomination {
  return {
    id: row.id,
    name: row.name,
    points: row.points,
    color: row.color,
    description: row.description,
    icon: row.icon,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listDenomsByWorkspace(tenant: string): Promise<Denomination[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(hasanatDenoms)
      .where(eq(hasanatDenoms.workspaceSubdomain, subdomain));
    return rows.map(denomRowToRecord);
  });
}

export async function bulkSaveDenoms(tenant: string, records: Denomination[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    for (const r of records) {
      await tx
        .insert(hasanatDenoms)
        .values({
          id: r.id,
          workspaceSubdomain: subdomain,
          name: r.name,
          points: r.points,
          color: r.color ?? 'emerald',
          description: r.description ?? '',
          icon: r.icon ?? 'Star',
          active: r.active ?? true,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [hasanatDenoms.workspaceSubdomain, hasanatDenoms.id],
          set: {
            name: r.name,
            points: r.points,
            color: r.color ?? 'emerald',
            description: r.description ?? '',
            icon: r.icon ?? 'Star',
            active: r.active ?? true,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceDenomsForWorkspace(tenant: string, records: Denomination[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(hasanatDenoms).where(eq(hasanatDenoms.workspaceSubdomain, subdomain));
    for (const r of records) {
      await tx.insert(hasanatDenoms).values({
        id: r.id,
        workspaceSubdomain: subdomain,
        name: r.name,
        points: r.points,
        color: r.color ?? 'emerald',
        description: r.description ?? '',
        icon: r.icon ?? 'Star',
        active: r.active ?? true,
        updatedAt: new Date(),
      });
    }
  });
}

// --- Batches ---

type BatchRow = typeof hasanatBatches.$inferSelect;
function batchRowToRecord(row: BatchRow): StockBatch {
  return {
    id: row.id,
    denominationId: row.denominationId,
    denominationName: row.denominationName,
    quantity: row.quantity,
    remaining: row.remaining,
    addedDate: row.addedDate,
    addedByUserId: row.addedByUserId ?? undefined,
    addedBy: row.addedBy ?? undefined,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listBatchesByWorkspace(tenant: string): Promise<StockBatch[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(hasanatBatches)
      .where(eq(hasanatBatches.workspaceSubdomain, subdomain));
    return rows.map(batchRowToRecord);
  });
}

export async function bulkSaveBatches(tenant: string, records: StockBatch[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    for (const r of records) {
      await tx
        .insert(hasanatBatches)
        .values({
          id: r.id,
          workspaceSubdomain: subdomain,
          denominationId: r.denominationId,
          denominationName: r.denominationName ?? '',
          quantity: r.quantity,
          remaining: r.remaining ?? r.quantity,
          addedDate: r.addedDate,
          addedByUserId: r.addedByUserId ?? null,
          addedBy: r.addedBy ?? null,
          note: r.note ?? '',
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [hasanatBatches.workspaceSubdomain, hasanatBatches.id],
          set: {
            denominationId: r.denominationId,
            denominationName: r.denominationName ?? '',
            quantity: r.quantity,
            remaining: r.remaining ?? r.quantity,
            addedDate: r.addedDate,
            addedByUserId: r.addedByUserId ?? null,
            addedBy: r.addedBy ?? null,
            note: r.note ?? '',
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceBatchesForWorkspace(tenant: string, records: StockBatch[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(hasanatBatches).where(eq(hasanatBatches.workspaceSubdomain, subdomain));
    for (const r of records) {
      await tx.insert(hasanatBatches).values({
        id: r.id,
        workspaceSubdomain: subdomain,
        denominationId: r.denominationId,
        denominationName: r.denominationName ?? '',
        quantity: r.quantity,
        remaining: r.remaining ?? r.quantity,
        addedDate: r.addedDate,
        addedByUserId: r.addedByUserId ?? null,
        addedBy: r.addedBy ?? null,
        note: r.note ?? '',
        updatedAt: new Date(),
      });
    }
  });
}

// --- Distributions ---

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
  return withTenantTransaction(subdomain, async (tx) => {
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
  return withTenantTransaction(subdomain, async (tx) => {
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
  await withTenantTransaction(subdomain, async (tx) => {
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
  await withTenantTransaction(subdomain, async (tx) => {
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
  await withTenantTransaction(subdomain, async (tx) => {
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

// --- Redemptions ---

type RedempRow = typeof hasanatRedemptions.$inferSelect;
function redemptionRowToRecord(row: RedempRow): Redemption {
  return {
    id: row.id,
    distributionId: row.distributionId,
    studentName: row.studentName ?? undefined,
    reward: row.reward,
    pointsUsed: row.pointsUsed,
    date: row.date,
    approvedByUserId: row.approvedByUserId ?? undefined,
    approvedBy: row.approvedBy ?? undefined,
  };
}

export async function listRedemptionsByWorkspace(tenant: string): Promise<Redemption[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(hasanatRedemptions)
      .where(eq(hasanatRedemptions.workspaceSubdomain, subdomain));
    return rows.map(redemptionRowToRecord);
  });
}

export async function bulkSaveRedemptions(tenant: string, records: Redemption[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    for (const r of records) {
      await tx
        .insert(hasanatRedemptions)
        .values({
          id: r.id,
          workspaceSubdomain: subdomain,
          distributionId: r.distributionId,
          studentName: r.studentName ?? '',
          reward: r.reward,
          pointsUsed: r.pointsUsed ?? 0,
          date: r.date,
          approvedByUserId: r.approvedByUserId ?? null,
          approvedBy: r.approvedBy ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [hasanatRedemptions.workspaceSubdomain, hasanatRedemptions.id],
          set: {
            distributionId: r.distributionId,
            studentName: r.studentName ?? '',
            reward: r.reward,
            pointsUsed: r.pointsUsed ?? 0,
            date: r.date,
            approvedByUserId: r.approvedByUserId ?? null,
            approvedBy: r.approvedBy ?? null,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceRedemptionsForWorkspace(tenant: string, records: Redemption[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(hasanatRedemptions).where(eq(hasanatRedemptions.workspaceSubdomain, subdomain));
    for (const r of records) {
      await tx.insert(hasanatRedemptions).values({
        id: r.id,
        workspaceSubdomain: subdomain,
        distributionId: r.distributionId,
        studentName: r.studentName ?? '',
        reward: r.reward,
        pointsUsed: r.pointsUsed ?? 0,
        date: r.date,
        approvedByUserId: r.approvedByUserId ?? null,
        approvedBy: r.approvedBy ?? null,
        updatedAt: new Date(),
      });
    }
  });
}

export async function deleteHasanatByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(hasanatRedemptions).where(eq(hasanatRedemptions.workspaceSubdomain, subdomain));
    await tx.delete(hasanatDistributions).where(eq(hasanatDistributions.workspaceSubdomain, subdomain));
    await tx.delete(hasanatBatches).where(eq(hasanatBatches.workspaceSubdomain, subdomain));
    await tx.delete(hasanatDenoms).where(eq(hasanatDenoms.workspaceSubdomain, subdomain));
  });
}
