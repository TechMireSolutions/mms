import { and, eq, isNull } from 'drizzle-orm';
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

export async function listObligationCollectionsByWorkspace(tenant: string): Promise<ObligationCollection[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(obligationCollections)
      .where(and(eq(obligationCollections.workspaceSubdomain, subdomain), isNull(obligationCollections.deletedAt)));
    return rows.map(obligationCollectionRowToRecord);
  });
}

export async function findObligationCollectionById(tenant: string, id: string): Promise<ObligationCollection | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(obligationCollections)
      .where(and(eq(obligationCollections.workspaceSubdomain, subdomain), eq(obligationCollections.id, id)));
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
    for (const record of records) {
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
    }
  });
}

export async function replaceObligationCollectionsForWorkspace(
  tenant: string,
  records: ObligationCollection[],
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(obligationCollections).where(eq(obligationCollections.workspaceSubdomain, subdomain));
    for (const record of records) {
      await tx.insert(obligationCollections).values({
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
      });
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
