import { eq, sql } from 'drizzle-orm';
import { type WakalaType } from '@mms/shared';
import { wakalaTypes } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type WakalaTypeRow = typeof wakalaTypes.$inferSelect;

export function wakalaTypeRowToRecord(row: WakalaTypeRow): WakalaType {
  return {
    id: row.id,
    mujtahid_representative_id: row.mujtahidRepresentativeId,
    obligation_type_id: row.obligationTypeId,
  };
}

export async function listWakalaTypesByWorkspace(tenant: string): Promise<WakalaType[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: wakalaTypes.id,
        workspaceSubdomain: wakalaTypes.workspaceSubdomain,
        mujtahidRepresentativeId: wakalaTypes.mujtahidRepresentativeId,
        obligationTypeId: wakalaTypes.obligationTypeId,
        createdAt: wakalaTypes.createdAt,
        updatedAt: wakalaTypes.updatedAt,
      })
      .from(wakalaTypes)
      .where(eq(wakalaTypes.workspaceSubdomain, subdomain));
    return rows.map(wakalaTypeRowToRecord);
  });
}

export async function bulkSaveWakalaTypes(tenant: string, records: WakalaType[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(wakalaTypes)
      .values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          mujtahidRepresentativeId: record.mujtahid_representative_id,
          obligationTypeId: record.obligation_type_id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [wakalaTypes.workspaceSubdomain, wakalaTypes.id],
        set: {
          mujtahidRepresentativeId: sql`excluded.mujtahid_representative_id`,
          obligationTypeId: sql`excluded.obligation_type_id`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceWakalaTypesForWorkspace(tenant: string, records: WakalaType[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(wakalaTypes).where(eq(wakalaTypes.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(wakalaTypes).values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          mujtahidRepresentativeId: record.mujtahid_representative_id,
          obligationTypeId: record.obligation_type_id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      );
    }
  });
}
