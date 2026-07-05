import {
  type Denomination,
  type StockBatch,
  type Distribution,
  type Redemption,
  denomListSchema,
  batchListSchema,
  distributionListSchema,
  redemptionListSchema,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listDenomsByWorkspace,
  replaceDenomsForWorkspace,
  listBatchesByWorkspace,
  replaceBatchesForWorkspace,
  listDistributionsByWorkspace,
  replaceDistributionsForWorkspace,
  listRedemptionsByWorkspace,
  replaceRedemptionsForWorkspace,
} from '../db/repositories/hasanatRepository.js';

// --- Helper WebSocket broadcaster ---
async function broadcast(logicalKey: string) {
  const tenant = getRequestTenant();
  if (tenant) {
    const { broadcastTenantUpdate } = await import('./websocketService.js');
    broadcastTenantUpdate(tenant, 'collection', logicalKey);
  }
}

// --- Denominations ---
export async function loadDenoms(): Promise<Denomination[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listDenomsByWorkspace(tenant);
}

export async function replaceDenoms(records: Denomination[]): Promise<Denomination[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = denomListSchema.parse(records);
  await replaceDenomsForWorkspace(tenant, parsed);
  await broadcast('hasanat_denoms');
  return parsed;
}

// --- Batches ---
export async function loadBatches(): Promise<StockBatch[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listBatchesByWorkspace(tenant);
}

export async function replaceBatches(records: StockBatch[]): Promise<StockBatch[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = batchListSchema.parse(records);
  await replaceBatchesForWorkspace(tenant, parsed);
  await broadcast('hasanat_batches');
  return parsed;
}

// --- Distributions ---
export async function loadDistributions(): Promise<Distribution[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listDistributionsByWorkspace(tenant);
}

export async function replaceDistributions(records: Distribution[]): Promise<Distribution[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = distributionListSchema.parse(records);
  await replaceDistributionsForWorkspace(tenant, parsed);
  await broadcast('hasanat_distributions');
  return parsed;
}

// --- Redemptions ---
export async function loadRedemptions(): Promise<Redemption[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listRedemptionsByWorkspace(tenant);
}

export async function replaceRedemptions(records: Redemption[]): Promise<Redemption[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = redemptionListSchema.parse(records);
  await replaceRedemptionsForWorkspace(tenant, parsed);
  await broadcast('hasanat_redemptions');
  return parsed;
}
