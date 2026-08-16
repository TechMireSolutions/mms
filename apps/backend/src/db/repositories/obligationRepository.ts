import { and, eq, isNull } from 'drizzle-orm';
import {
  type ObligationType,
  type Mujtahid,
  type MujtahidRep,
  type WakalaType,
  type ObligationDistribution,
  type ObligationCollection,
} from '@mms/shared';
import {
  obligationTypes,
  mujtahids,
  mujtahidReps,
  wakalaTypes,
  obligationDistributions,
  obligationCollections,
} from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

// --- Obligation Types ---

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
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(obligationTypes)
      .where(eq(obligationTypes.workspaceSubdomain, subdomain));
    return rows.map(obligationTypeRowToRecord);
  });
}

export async function bulkSaveObligationTypes(tenant: string, records: ObligationType[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    for (const record of records) {
      await tx
        .insert(obligationTypes)
        .values({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          quantityBased: Boolean(record.quantity_based),
          designatedFor: record.designated_for ?? 'Both',
          createdAt: record.created_at ? new Date(record.created_at) : new Date(),
          updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
        })
        .onConflictDoUpdate({
          target: [obligationTypes.workspaceSubdomain, obligationTypes.id],
          set: {
            name: record.name,
            quantityBased: Boolean(record.quantity_based),
            designatedFor: record.designated_for ?? 'Both',
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceObligationTypesForWorkspace(
  tenant: string,
  records: ObligationType[],
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(obligationTypes).where(eq(obligationTypes.workspaceSubdomain, subdomain));
    for (const record of records) {
      await tx.insert(obligationTypes).values({
        id: record.id,
        workspaceSubdomain: subdomain,
        name: record.name,
        quantityBased: Boolean(record.quantity_based),
        designatedFor: record.designated_for ?? 'Both',
        createdAt: record.created_at ? new Date(record.created_at) : new Date(),
        updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
      });
    }
  });
}

// --- Mujtahids ---

type MujtahidRow = typeof mujtahids.$inferSelect;

export function mujtahidRowToRecord(row: MujtahidRow): Mujtahid {
  return {
    id: row.id,
    name: row.name,
  };
}

export async function listMujtahidsByWorkspace(tenant: string): Promise<Mujtahid[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(mujtahids)
      .where(eq(mujtahids.workspaceSubdomain, subdomain));
    return rows.map(mujtahidRowToRecord);
  });
}

export async function bulkSaveMujtahids(tenant: string, records: Mujtahid[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    for (const record of records) {
      await tx
        .insert(mujtahids)
        .values({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [mujtahids.workspaceSubdomain, mujtahids.id],
          set: {
            name: record.name,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceMujtahidsForWorkspace(tenant: string, records: Mujtahid[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(mujtahids).where(eq(mujtahids.workspaceSubdomain, subdomain));
    for (const record of records) {
      await tx.insert(mujtahids).values({
        id: record.id,
        workspaceSubdomain: subdomain,
        name: record.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });
}

// --- Mujtahid Reps ---

type MujtahidRepRow = typeof mujtahidReps.$inferSelect;

export function mujtahidRepRowToRecord(row: MujtahidRepRow): MujtahidRep {
  return {
    id: row.id,
    name: row.name,
    mujtahid_id: row.mujtahidId,
  };
}

export async function listMujtahidRepsByWorkspace(tenant: string): Promise<MujtahidRep[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(mujtahidReps)
      .where(eq(mujtahidReps.workspaceSubdomain, subdomain));
    return rows.map(mujtahidRepRowToRecord);
  });
}

export async function bulkSaveMujtahidReps(tenant: string, records: MujtahidRep[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    for (const record of records) {
      await tx
        .insert(mujtahidReps)
        .values({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          mujtahidId: record.mujtahid_id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [mujtahidReps.workspaceSubdomain, mujtahidReps.id],
          set: {
            name: record.name,
            mujtahidId: record.mujtahid_id,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceMujtahidRepsForWorkspace(tenant: string, records: MujtahidRep[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(mujtahidReps).where(eq(mujtahidReps.workspaceSubdomain, subdomain));
    for (const record of records) {
      await tx.insert(mujtahidReps).values({
        id: record.id,
        workspaceSubdomain: subdomain,
        name: record.name,
        mujtahidId: record.mujtahid_id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });
}

// --- Wakala Types ---

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
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(wakalaTypes)
      .where(eq(wakalaTypes.workspaceSubdomain, subdomain));
    return rows.map(wakalaTypeRowToRecord);
  });
}

export async function bulkSaveWakalaTypes(tenant: string, records: WakalaType[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    for (const record of records) {
      await tx
        .insert(wakalaTypes)
        .values({
          id: record.id,
          workspaceSubdomain: subdomain,
          mujtahidRepresentativeId: record.mujtahid_representative_id,
          obligationTypeId: record.obligation_type_id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [wakalaTypes.workspaceSubdomain, wakalaTypes.id],
          set: {
            mujtahidRepresentativeId: record.mujtahid_representative_id,
            obligationTypeId: record.obligation_type_id,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceWakalaTypesForWorkspace(tenant: string, records: WakalaType[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(wakalaTypes).where(eq(wakalaTypes.workspaceSubdomain, subdomain));
    for (const record of records) {
      await tx.insert(wakalaTypes).values({
        id: record.id,
        workspaceSubdomain: subdomain,
        mujtahidRepresentativeId: record.mujtahid_representative_id,
        obligationTypeId: record.obligation_type_id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });
}

// --- Obligation Distributions ---

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
  return withTenantTransaction(subdomain, async (tx) => {
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
  await withTenantTransaction(subdomain, async (tx) => {
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
  await withTenantTransaction(subdomain, async (tx) => {
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

// --- Obligation Collections ---

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
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(obligationCollections)
      .where(and(eq(obligationCollections.workspaceSubdomain, subdomain), isNull(obligationCollections.deletedAt)));
    return rows.map(obligationCollectionRowToRecord);
  });
}

export async function findObligationCollectionById(tenant: string, id: string): Promise<ObligationCollection | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
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
  await withTenantTransaction(subdomain, async (tx) => {
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
  await withTenantTransaction(subdomain, async (tx) => {
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
  await withTenantTransaction(subdomain, async (tx) => {
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
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(obligationCollections).where(eq(obligationCollections.workspaceSubdomain, subdomain));
    await tx.delete(obligationDistributions).where(eq(obligationDistributions.workspaceSubdomain, subdomain));
    await tx.delete(wakalaTypes).where(eq(wakalaTypes.workspaceSubdomain, subdomain));
    await tx.delete(mujtahidReps).where(eq(mujtahidReps.workspaceSubdomain, subdomain));
    await tx.delete(mujtahids).where(eq(mujtahids.workspaceSubdomain, subdomain));
    await tx.delete(obligationTypes).where(eq(obligationTypes.workspaceSubdomain, subdomain));
  });
}
