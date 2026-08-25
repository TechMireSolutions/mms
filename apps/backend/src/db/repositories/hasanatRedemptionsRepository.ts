import { eq } from 'drizzle-orm';
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
  return withTenant(subdomain, async (tx) => {
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
  await withTenant(subdomain, async (tx) => {
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
  await withTenant(subdomain, async (tx) => {
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
  await withTenant(subdomain, async (tx) => {
    await tx.delete(hasanatRedemptions).where(eq(hasanatRedemptions.workspaceSubdomain, subdomain));
    await tx.delete(hasanatDistributions).where(eq(hasanatDistributions.workspaceSubdomain, subdomain));
    await tx.delete(hasanatBatches).where(eq(hasanatBatches.workspaceSubdomain, subdomain));
    await tx.delete(hasanatDenoms).where(eq(hasanatDenoms.workspaceSubdomain, subdomain));
  });
}
