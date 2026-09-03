import { eq, sql } from 'drizzle-orm';
import { type ObligationType } from '@mms/shared';
import { obligationTypes } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type ObligationTypeRow = typeof obligationTypes.$inferSelect;

export function obligationTypeRowToRecord(row: ObligationTypeRow): ObligationType {
  return {
    id: row.id,
    name: row.name,
    quantity_based: row.quantityBased,
    designated_for: row.designatedFor as ObligationType['designated_for'],
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export async function listObligationTypesByWorkspace(tenant: string): Promise<ObligationType[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: obligationTypes.id,
        workspaceSubdomain: obligationTypes.workspaceSubdomain,
        name: obligationTypes.name,
        quantityBased: obligationTypes.quantityBased,
        designatedFor: obligationTypes.designatedFor,
        createdAt: obligationTypes.createdAt,
        updatedAt: obligationTypes.updatedAt,
      })
      .from(obligationTypes)
      .where(eq(obligationTypes.workspaceSubdomain, subdomain));
    return rows.map(obligationTypeRowToRecord);
  });
}

export async function bulkSaveObligationTypes(tenant: string, records: ObligationType[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(obligationTypes)
      .values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          quantityBased: Boolean(record.quantity_based),
          designatedFor: record.designated_for ?? 'Both',
          createdAt: record.created_at ? new Date(record.created_at) : new Date(),
          updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [obligationTypes.workspaceSubdomain, obligationTypes.id],
        set: {
          name: sql`excluded.name`,
          quantityBased: sql`excluded.quantity_based`,
          designatedFor: sql`excluded.designated_for`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceObligationTypesForWorkspace(
  tenant: string,
  records: ObligationType[],
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(obligationTypes).where(eq(obligationTypes.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(obligationTypes).values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          quantityBased: Boolean(record.quantity_based),
          designatedFor: record.designated_for ?? 'Both',
          createdAt: record.created_at ? new Date(record.created_at) : new Date(),
          updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
        })),
      );
    }
  });
}
