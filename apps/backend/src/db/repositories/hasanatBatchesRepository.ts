import { eq, sql } from 'drizzle-orm';
import { type StockBatch } from '@mms/shared';
import { hasanatBatches } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type BatchRow = typeof hasanatBatches.$inferSelect;

export function batchRowToRecord(row: BatchRow): StockBatch {
  const batch: StockBatch = {
    id: row.id,
    denominationId: row.denominationId,
    denominationName: row.denominationName,
    quantity: row.quantity,
    remaining: row.remaining,
    addedDate: row.addedDate,
    note: row.note,
  };

  if (row.addedByUserId) batch.addedByUserId = row.addedByUserId;
  if (row.addedBy) batch.addedBy = row.addedBy;

  return batch;
}

export async function listBatchesByWorkspace(tenant: string, options?: { limit?: number; offset?: number }): Promise<StockBatch[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 500, 1), 5000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: hasanatBatches.id,
        workspaceSubdomain: hasanatBatches.workspaceSubdomain,
        denominationId: hasanatBatches.denominationId,
        denominationName: hasanatBatches.denominationName,
        quantity: hasanatBatches.quantity,
        remaining: hasanatBatches.remaining,
        addedDate: hasanatBatches.addedDate,
        addedByUserId: hasanatBatches.addedByUserId,
        addedBy: hasanatBatches.addedBy,
        note: hasanatBatches.note,
        updatedAt: hasanatBatches.updatedAt,
        createdAt: hasanatBatches.createdAt,
      })
      .from(hasanatBatches)
      .where(eq(hasanatBatches.workspaceSubdomain, subdomain))
      .limit(limit)
      .offset(offset);
    return rows.map(batchRowToRecord);
  });
}

export async function bulkSaveBatches(tenant: string, records: StockBatch[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(hasanatBatches)
      .values(
        records.map((r) => ({
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
        })),
      )
      .onConflictDoUpdate({
        target: [hasanatBatches.workspaceSubdomain, hasanatBatches.id],
        set: {
          denominationId: sql`excluded.denomination_id`,
          denominationName: sql`excluded.denomination_name`,
          quantity: sql`excluded.quantity`,
          remaining: sql`excluded.remaining`,
          addedDate: sql`excluded.added_date`,
          addedByUserId: sql`excluded.added_by_user_id`,
          addedBy: sql`excluded.added_by`,
          note: sql`excluded.note`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceBatchesForWorkspace(tenant: string, records: StockBatch[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(hasanatBatches).where(eq(hasanatBatches.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(hasanatBatches).values(
        records.map((r) => ({
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
        })),
      );
    }
  });
}
