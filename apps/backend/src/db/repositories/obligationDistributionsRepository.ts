import { eq, sql } from 'drizzle-orm';
import { type ObligationDistribution } from '@mms/shared';
import { obligationDistributions } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type ObligationDistributionRow = typeof obligationDistributions.$inferSelect;

export function obligationDistributionRowToRecord(row: ObligationDistributionRow): ObligationDistribution {
  return {
    id: row.id,
    name: row.name,
    percentage: Number(row.percentage),
    wakala_type_id: row.wakalaTypeId,
    type: row.type as ObligationDistribution['type'],
  };
}

export async function listObligationDistributionsByWorkspace(tenant: string): Promise<ObligationDistribution[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: obligationDistributions.id,
        workspaceSubdomain: obligationDistributions.workspaceSubdomain,
        name: obligationDistributions.name,
        percentage: obligationDistributions.percentage,
        wakalaTypeId: obligationDistributions.wakalaTypeId,
        type: obligationDistributions.type,
        createdAt: obligationDistributions.createdAt,
        updatedAt: obligationDistributions.updatedAt,
      })
      .from(obligationDistributions)
      .where(eq(obligationDistributions.workspaceSubdomain, subdomain));
    return rows.map(obligationDistributionRowToRecord);
  });
}

export async function bulkSaveObligationDistributions(
  tenant: string,
  records: ObligationDistribution[],
): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(obligationDistributions)
      .values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          percentage: String(record.percentage),
          wakalaTypeId: record.wakala_type_id,
          type: record.type,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [obligationDistributions.workspaceSubdomain, obligationDistributions.id],
        set: {
          name: sql`excluded.name`,
          percentage: sql`excluded.percentage`,
          wakalaTypeId: sql`excluded.wakala_type_id`,
          type: sql`excluded.type`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceObligationDistributionsForWorkspace(
  tenant: string,
  records: ObligationDistribution[],
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(obligationDistributions).where(eq(obligationDistributions.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(obligationDistributions).values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          percentage: String(record.percentage),
          wakalaTypeId: record.wakala_type_id,
          type: record.type,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      );
    }
  });
}
