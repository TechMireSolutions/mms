import { eq, sql } from 'drizzle-orm';
import { type Redemption } from '@mms/shared';
import {
  hasanatDenoms,
  hasanatBatches,
  hasanatDistributions,
  hasanatRedemptions,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';

type RedempRow = typeof hasanatRedemptions.$inferSelect;
function redemptionRowToRecord(row: RedempRow): Redemption {
  const redemption: Redemption = {
    id: row.id,
    distributionId: row.distributionId,
    studentName: row.studentName ?? '',
    reward: row.reward,
    pointsUsed: row.pointsUsed,
    date: row.date,
  };

  if (row.approvedByUserId) redemption.approvedByUserId = row.approvedByUserId;
  if (row.approvedBy) redemption.approvedBy = row.approvedBy;

  return redemption;
}

export async function listRedemptionsByWorkspace(tenant: string, options?: { limit?: number; offset?: number }): Promise<Redemption[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 1000, 1), 10000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: hasanatRedemptions.id,
        workspaceSubdomain: hasanatRedemptions.workspaceSubdomain,
        distributionId: hasanatRedemptions.distributionId,
        studentName: hasanatRedemptions.studentName,
        reward: hasanatRedemptions.reward,
        pointsUsed: hasanatRedemptions.pointsUsed,
        date: hasanatRedemptions.date,
        approvedByUserId: hasanatRedemptions.approvedByUserId,
        approvedBy: hasanatRedemptions.approvedBy,
        updatedAt: hasanatRedemptions.updatedAt,
        createdAt: hasanatRedemptions.createdAt,
      })
      .from(hasanatRedemptions)
      .where(eq(hasanatRedemptions.workspaceSubdomain, subdomain))
      .limit(limit)
      .offset(offset);
    return rows.map(redemptionRowToRecord);
  });
}

export async function bulkSaveRedemptions(tenant: string, records: Redemption[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(hasanatRedemptions)
      .values(
        records.map((r) => ({
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
        })),
      )
      .onConflictDoUpdate({
        target: [hasanatRedemptions.workspaceSubdomain, hasanatRedemptions.id],
        set: {
          distributionId: sql`excluded.distribution_id`,
          studentName: sql`excluded.student_name`,
          reward: sql`excluded.reward`,
          pointsUsed: sql`excluded.points_used`,
          date: sql`excluded.date`,
          approvedByUserId: sql`excluded.approved_by_user_id`,
          approvedBy: sql`excluded.approved_by`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceRedemptionsForWorkspace(tenant: string, records: Redemption[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(hasanatRedemptions).where(eq(hasanatRedemptions.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(hasanatRedemptions).values(
        records.map((r) => ({
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
        })),
      );
    }
  });
}

export async function deleteHasanatByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(hasanatRedemptions).where(eq(hasanatRedemptions.workspaceSubdomain, subdomain));
    await tx.delete(hasanatDistributions).where(eq(hasanatDistributions.workspaceSubdomain, subdomain));
    await tx.delete(hasanatBatches).where(eq(hasanatBatches.workspaceSubdomain, subdomain));
    await tx.delete(hasanatDenoms).where(eq(hasanatDenoms.workspaceSubdomain, subdomain));
  });
}
