import { eq } from 'drizzle-orm';
import { type StockBatch } from '@mms/shared';
import { hasanatBatches } from '../schema.js';
import { withTenant } from '../tenant-context.js';

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
  return withTenant(subdomain, async (tx) => {
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
  await withTenant(subdomain, async (tx) => {
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
  await withTenant(subdomain, async (tx) => {
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
