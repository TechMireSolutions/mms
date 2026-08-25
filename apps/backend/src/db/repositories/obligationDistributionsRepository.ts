import { eq } from 'drizzle-orm';
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
      .select()
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
    for (const record of records) {
      await tx
        .insert(obligationDistributions)
        .values({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          percentage: String(record.percentage),
          wakalaTypeId: record.wakala_type_id,
          type: record.type,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [obligationDistributions.workspaceSubdomain, obligationDistributions.id],
          set: {
            name: record.name,
            percentage: String(record.percentage),
            wakalaTypeId: record.wakala_type_id,
            type: record.type,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceObligationDistributionsForWorkspace(
  tenant: string,
  records: ObligationDistribution[],
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(obligationDistributions).where(eq(obligationDistributions.workspaceSubdomain, subdomain));
    for (const record of records) {
      await tx.insert(obligationDistributions).values({
        id: record.id,
        workspaceSubdomain: subdomain,
        name: record.name,
        percentage: String(record.percentage),
        wakalaTypeId: record.wakala_type_id,
        type: record.type,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });
}
