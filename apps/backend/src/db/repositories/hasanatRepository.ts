import { eq } from 'drizzle-orm';
import {
  type Denomination,
  type StockBatch,
  type Distribution,
  type Redemption,
} from '@mms/shared';
import { getDb } from '../dbClient.js';
import {
  hasanatDenoms,
  hasanatBatches,
  hasanatDistributions,
  hasanatRedemptions,
} from '../schema.js';

// --- Helper row mappers ---
function rowToDenom(row: typeof hasanatDenoms.$inferSelect): Denomination {
  return { ...(row.customData as Omit<Denomination, 'id'>), id: row.id } as Denomination;
}
function rowToBatch(row: typeof hasanatBatches.$inferSelect): StockBatch {
  return { ...(row.customData as Omit<StockBatch, 'id'>), id: row.id } as StockBatch;
}
function rowToDistribution(row: typeof hasanatDistributions.$inferSelect): Distribution {
  return { ...(row.customData as Omit<Distribution, 'id'>), id: row.id } as Distribution;
}
function rowToRedemption(row: typeof hasanatRedemptions.$inferSelect): Redemption {
  return { ...(row.customData as Omit<Redemption, 'id'>), id: row.id } as Redemption;
}

// ==========================================
// 1. Denominations
// ==========================================
export async function listDenomsByWorkspace(workspaceSubdomain: string): Promise<Denomination[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(hasanatDenoms).where(eq(hasanatDenoms.workspaceSubdomain, subdomain));
  return rows.map(rowToDenom);
}

export async function replaceDenomsForWorkspace(workspaceSubdomain: string, list: Denomination[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(hasanatDenoms).where(eq(hasanatDenoms.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(hasanatDenoms).values(values);
}

// ==========================================
// 2. Batches
// ==========================================
export async function listBatchesByWorkspace(workspaceSubdomain: string): Promise<StockBatch[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(hasanatBatches).where(eq(hasanatBatches.workspaceSubdomain, subdomain));
  return rows.map(rowToBatch);
}

export async function replaceBatchesForWorkspace(workspaceSubdomain: string, list: StockBatch[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(hasanatBatches).where(eq(hasanatBatches.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(hasanatBatches).values(values);
}

// ==========================================
// 3. Distributions
// ==========================================
export async function listDistributionsByWorkspace(workspaceSubdomain: string): Promise<Distribution[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(hasanatDistributions).where(eq(hasanatDistributions.workspaceSubdomain, subdomain));
  return rows.map(rowToDistribution);
}

export async function replaceDistributionsForWorkspace(workspaceSubdomain: string, list: Distribution[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(hasanatDistributions).where(eq(hasanatDistributions.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(hasanatDistributions).values(values);
}

// ==========================================
// 4. Redemptions
// ==========================================
export async function listRedemptionsByWorkspace(workspaceSubdomain: string): Promise<Redemption[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(hasanatRedemptions).where(eq(hasanatRedemptions.workspaceSubdomain, subdomain));
  return rows.map(rowToRedemption);
}

export async function replaceRedemptionsForWorkspace(workspaceSubdomain: string, list: Redemption[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(hasanatRedemptions).where(eq(hasanatRedemptions.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(hasanatRedemptions).values(values);
}

// ==========================================
// 5. Workspace Purge
// ==========================================
export async function deleteHasanatByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(hasanatDenoms).where(eq(hasanatDenoms.workspaceSubdomain, subdomain));
  await db.delete(hasanatBatches).where(eq(hasanatBatches.workspaceSubdomain, subdomain));
  await db.delete(hasanatDistributions).where(eq(hasanatDistributions.workspaceSubdomain, subdomain));
  await db.delete(hasanatRedemptions).where(eq(hasanatRedemptions.workspaceSubdomain, subdomain));
}
