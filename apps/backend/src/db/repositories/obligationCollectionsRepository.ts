import { and, eq, isNull, sql } from 'drizzle-orm';
import { type ObligationCollection } from '@mms/shared';
import {
  obligationCollections,
  obligationDistributions,
  obligationTypes,
  wakalaTypes,
  mujtahidReps,
  mujtahids,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';

type ObligationCollectionRow = typeof obligationCollections.$inferSelect;

export function obligationCollectionRowToRecord(row: ObligationCollectionRow): ObligationCollection {
  return {
    id: row.id,
    receipt_no: row.receiptNo,
    received_date: row.receivedDate,
    sender_id: row.senderId,
    reference_id: row.referenceId ?? null,
    amount: Number(row.amount),
    currency_id: row.currencyId,
    payment_mode: row.paymentMode as ObligationCollection['payment_mode'],
    obligation_type_id: row.obligationTypeId,
    mujtahid_representative_id: row.mujtahidRepresentativeId,
    received_by: row.receivedBy,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
  };
}

export async function listObligationCollectionsByWorkspace(tenant: string, options?: { limit?: number; offset?: number }): Promise<ObligationCollection[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 2000, 1), 10000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: obligationCollections.id,
        workspaceSubdomain: obligationCollections.workspaceSubdomain,
        receiptNo: obligationCollections.receiptNo,
        receivedDate: obligationCollections.receivedDate,
        senderId: obligationCollections.senderId,
        referenceId: obligationCollections.referenceId,
        amount: obligationCollections.amount,
        currencyId: obligationCollections.currencyId,
        paymentMode: obligationCollections.paymentMode,
        obligationTypeId: obligationCollections.obligationTypeId,
        mujtahidRepresentativeId: obligationCollections.mujtahidRepresentativeId,
        receivedBy: obligationCollections.receivedBy,
        deletedAt: obligationCollections.deletedAt,
        deletedBy: obligationCollections.deletedBy,
        deletionReason: obligationCollections.deletionReason,
        createdAt: obligationCollections.createdAt,
        updatedAt: obligationCollections.updatedAt,
      })
      .from(obligationCollections)
      .where(and(eq(obligationCollections.workspaceSubdomain, subdomain), isNull(obligationCollections.deletedAt)))
      .limit(limit)
      .offset(offset);
    return rows.map(obligationCollectionRowToRecord);
  });
}

export async function findObligationCollectionById(tenant: string, id: string): Promise<ObligationCollection | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: obligationCollections.id,
        workspaceSubdomain: obligationCollections.workspaceSubdomain,
        receiptNo: obligationCollections.receiptNo,
        receivedDate: obligationCollections.receivedDate,
        senderId: obligationCollections.senderId,
        referenceId: obligationCollections.referenceId,
        amount: obligationCollections.amount,
        currencyId: obligationCollections.currencyId,
        paymentMode: obligationCollections.paymentMode,
        obligationTypeId: obligationCollections.obligationTypeId,
        mujtahidRepresentativeId: obligationCollections.mujtahidRepresentativeId,
        receivedBy: obligationCollections.receivedBy,
        deletedAt: obligationCollections.deletedAt,
        deletedBy: obligationCollections.deletedBy,
        deletionReason: obligationCollections.deletionReason,
        createdAt: obligationCollections.createdAt,
        updatedAt: obligationCollections.updatedAt,
      })
      .from(obligationCollections)
      .where(and(eq(obligationCollections.workspaceSubdomain, subdomain), eq(obligationCollections.id, id)))
      .limit(1);
    const row = rows[0];
    return row ? obligationCollectionRowToRecord(row) : null;
  });
}

export async function saveObligationCollection(tenant: string, record: ObligationCollection): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(obligationCollections)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        receiptNo: record.receipt_no,
        receivedDate: record.received_date,
        senderId: record.sender_id,
        referenceId: record.reference_id ?? null,
        amount: String(record.amount),
        currencyId: record.currency_id,
        paymentMode: record.payment_mode,
        obligationTypeId: record.obligation_type_id,
        mujtahidRepresentativeId: record.mujtahid_representative_id,
        receivedBy: record.received_by,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        createdAt: record.created_at ? new Date(record.created_at) : new Date(),
        updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
      })
      .onConflictDoUpdate({
        target: [obligationCollections.workspaceSubdomain, obligationCollections.id],
        set: {
          receiptNo: record.receipt_no,
          receivedDate: record.received_date,
          senderId: record.sender_id,
          referenceId: record.reference_id ?? null,
          amount: String(record.amount),
          currencyId: record.currency_id,
          paymentMode: record.payment_mode,
          obligationTypeId: record.obligation_type_id,
          mujtahidRepresentativeId: record.mujtahid_representative_id,
          receivedBy: record.received_by,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        },
      });
  });
}

export async function bulkSaveObligationCollections(
  tenant: string,
  records: ObligationCollection[],
): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(obligationCollections)
      .values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          receiptNo: record.receipt_no,
          receivedDate: record.received_date,
          senderId: record.sender_id,
          referenceId: record.reference_id ?? null,
          amount: String(record.amount),
          currencyId: record.currency_id,
          paymentMode: record.payment_mode,
          obligationTypeId: record.obligation_type_id,
          mujtahidRepresentativeId: record.mujtahid_representative_id,
          receivedBy: record.received_by,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          createdAt: record.created_at ? new Date(record.created_at) : new Date(),
          updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [obligationCollections.workspaceSubdomain, obligationCollections.id],
        set: {
          receiptNo: sql`excluded.receipt_no`,
          receivedDate: sql`excluded.received_date`,
          senderId: sql`excluded.sender_id`,
          referenceId: sql`excluded.reference_id`,
          amount: sql`excluded.amount`,
          currencyId: sql`excluded.currency_id`,
          paymentMode: sql`excluded.payment_mode`,
          obligationTypeId: sql`excluded.obligation_type_id`,
          mujtahidRepresentativeId: sql`excluded.mujtahid_representative_id`,
          receivedBy: sql`excluded.received_by`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceObligationCollectionsForWorkspace(
  tenant: string,
  records: ObligationCollection[],
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(obligationCollections).where(eq(obligationCollections.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(obligationCollections).values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          receiptNo: record.receipt_no,
          receivedDate: record.received_date,
          senderId: record.sender_id,
          referenceId: record.reference_id ?? null,
          amount: String(record.amount),
          currencyId: record.currency_id,
          paymentMode: record.payment_mode,
          obligationTypeId: record.obligation_type_id,
          mujtahidRepresentativeId: record.mujtahid_representative_id,
          receivedBy: record.received_by,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          createdAt: record.created_at ? new Date(record.created_at) : new Date(),
          updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
        })),
      );
    }
  });
}

export async function deleteObligationsByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(obligationCollections).where(eq(obligationCollections.workspaceSubdomain, subdomain));
    await tx.delete(obligationDistributions).where(eq(obligationDistributions.workspaceSubdomain, subdomain));
    await tx.delete(wakalaTypes).where(eq(wakalaTypes.workspaceSubdomain, subdomain));
    await tx.delete(mujtahidReps).where(eq(mujtahidReps.workspaceSubdomain, subdomain));
    await tx.delete(mujtahids).where(eq(mujtahids.workspaceSubdomain, subdomain));
    await tx.delete(obligationTypes).where(eq(obligationTypes.workspaceSubdomain, subdomain));
  });
}
