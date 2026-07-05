import { eq } from 'drizzle-orm';
import {
  type ObligationType,
  type Mujtahid,
  type MujtahidRep,
  type WakalaType,
  type ObligationDistribution,
  type ObligationCollection,
} from '@mms/shared';
import { getDb } from '../dbClient.js';
import {
  obligationTypes,
  mujtahids,
  mujtahidReps,
  wakalaTypes,
  obligationDistributions,
  obligationCollections,
} from '../schema.js';

// --- Helper row mappers ---
function rowToType(row: typeof obligationTypes.$inferSelect): ObligationType {
  return { ...(row.customData as Omit<ObligationType, 'id'>), id: row.id } as ObligationType;
}
function rowToMujtahid(row: typeof mujtahids.$inferSelect): Mujtahid {
  return { ...(row.customData as Omit<Mujtahid, 'id'>), id: row.id } as Mujtahid;
}
function rowToRep(row: typeof mujtahidReps.$inferSelect): MujtahidRep {
  return { ...(row.customData as Omit<MujtahidRep, 'id'>), id: row.id } as MujtahidRep;
}
function rowToWakala(row: typeof wakalaTypes.$inferSelect): WakalaType {
  return { ...(row.customData as Omit<WakalaType, 'id'>), id: row.id } as WakalaType;
}
function rowToDistribution(row: typeof obligationDistributions.$inferSelect): ObligationDistribution {
  return { ...(row.customData as Omit<ObligationDistribution, 'id'>), id: row.id } as ObligationDistribution;
}
function rowToCollection(row: typeof obligationCollections.$inferSelect): ObligationCollection {
  return { ...(row.customData as Omit<ObligationCollection, 'id'>), id: row.id } as ObligationCollection;
}

// ==========================================
// 1. Obligation Types
// ==========================================
export async function listObligationTypesByWorkspace(workspaceSubdomain: string): Promise<ObligationType[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(obligationTypes).where(eq(obligationTypes.workspaceSubdomain, subdomain));
  return rows.map(rowToType);
}

export async function replaceObligationTypesForWorkspace(workspaceSubdomain: string, list: ObligationType[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(obligationTypes).where(eq(obligationTypes.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(obligationTypes).values(values);
}

// ==========================================
// 2. Mujtahids
// ==========================================
export async function listMujtahidsByWorkspace(workspaceSubdomain: string): Promise<Mujtahid[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(mujtahids).where(eq(mujtahids.workspaceSubdomain, subdomain));
  return rows.map(rowToMujtahid);
}

export async function replaceMujtahidsForWorkspace(workspaceSubdomain: string, list: Mujtahid[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(mujtahids).where(eq(mujtahids.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(mujtahids).values(values);
}

// ==========================================
// 3. Mujtahid Reps
// ==========================================
export async function listMujtahidRepsByWorkspace(workspaceSubdomain: string): Promise<MujtahidRep[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(mujtahidReps).where(eq(mujtahidReps.workspaceSubdomain, subdomain));
  return rows.map(rowToRep);
}

export async function replaceMujtahidRepsForWorkspace(workspaceSubdomain: string, list: MujtahidRep[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(mujtahidReps).where(eq(mujtahidReps.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(mujtahidReps).values(values);
}

// ==========================================
// 4. Wakala Types
// ==========================================
export async function listWakalaTypesByWorkspace(workspaceSubdomain: string): Promise<WakalaType[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(wakalaTypes).where(eq(wakalaTypes.workspaceSubdomain, subdomain));
  return rows.map(rowToWakala);
}

export async function replaceWakalaTypesForWorkspace(workspaceSubdomain: string, list: WakalaType[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(wakalaTypes).where(eq(wakalaTypes.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(wakalaTypes).values(values);
}

// ==========================================
// 5. Obligation Distributions
// ==========================================
export async function listObligationDistributionsByWorkspace(workspaceSubdomain: string): Promise<ObligationDistribution[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(obligationDistributions).where(eq(obligationDistributions.workspaceSubdomain, subdomain));
  return rows.map(rowToDistribution);
}

export async function replaceObligationDistributionsForWorkspace(workspaceSubdomain: string, list: ObligationDistribution[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(obligationDistributions).where(eq(obligationDistributions.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(obligationDistributions).values(values);
}

// ==========================================
// 6. Obligation Collections
// ==========================================
export async function listObligationCollectionsByWorkspace(workspaceSubdomain: string): Promise<ObligationCollection[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(obligationCollections).where(eq(obligationCollections.workspaceSubdomain, subdomain));
  return rows.map(rowToCollection);
}

export async function replaceObligationCollectionsForWorkspace(workspaceSubdomain: string, list: ObligationCollection[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(obligationCollections).where(eq(obligationCollections.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(obligationCollections).values(values);
}

// ==========================================
// Global purges
// ==========================================
export async function deleteObligationsByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(obligationTypes).where(eq(obligationTypes.workspaceSubdomain, subdomain));
  await db.delete(mujtahids).where(eq(mujtahids.workspaceSubdomain, subdomain));
  await db.delete(mujtahidReps).where(eq(mujtahidReps.workspaceSubdomain, subdomain));
  await db.delete(wakalaTypes).where(eq(wakalaTypes.workspaceSubdomain, subdomain));
  await db.delete(obligationDistributions).where(eq(obligationDistributions.workspaceSubdomain, subdomain));
  await db.delete(obligationCollections).where(eq(obligationCollections.workspaceSubdomain, subdomain));
}
