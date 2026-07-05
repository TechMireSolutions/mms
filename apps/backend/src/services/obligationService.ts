import {
  type ObligationType,
  type Mujtahid,
  type MujtahidRep,
  type WakalaType,
  type ObligationDistribution,
  type ObligationCollection,
  obligationTypeListSchema,
  mujtahidListSchema,
  mujtahidRepListSchema,
  wakalaTypeListSchema,
  obligationDistributionListSchema,
  obligationCollectionListSchema,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listObligationTypesByWorkspace,
  replaceObligationTypesForWorkspace,
  listMujtahidsByWorkspace,
  replaceMujtahidsForWorkspace,
  listMujtahidRepsByWorkspace,
  replaceMujtahidRepsForWorkspace,
  listWakalaTypesByWorkspace,
  replaceWakalaTypesForWorkspace,
  listObligationDistributionsByWorkspace,
  replaceObligationDistributionsForWorkspace,
  listObligationCollectionsByWorkspace,
  replaceObligationCollectionsForWorkspace,
} from '../db/repositories/obligationRepository.js';

// --- Helper WebSocket broadcaster ---
async function broadcast(logicalKey: string) {
  const tenant = getRequestTenant();
  if (tenant) {
    const { broadcastTenantUpdate } = await import('./websocketService.js');
    broadcastTenantUpdate(tenant, 'collection', logicalKey);
  }
}

// --- Obligation Types ---
export async function loadObligationTypes(): Promise<ObligationType[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listObligationTypesByWorkspace(tenant);
}

export async function replaceObligationTypes(records: ObligationType[]): Promise<ObligationType[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = obligationTypeListSchema.parse(records);
  await replaceObligationTypesForWorkspace(tenant, parsed);
  await broadcast('obligation_types');
  return parsed;
}

// --- Mujtahids ---
export async function loadMujtahids(): Promise<Mujtahid[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listMujtahidsByWorkspace(tenant);
}

export async function replaceMujtahids(records: Mujtahid[]): Promise<Mujtahid[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = mujtahidListSchema.parse(records);
  await replaceMujtahidsForWorkspace(tenant, parsed);
  await broadcast('mujtahids');
  return parsed;
}

// --- Mujtahid Reps ---
export async function loadMujtahidReps(): Promise<MujtahidRep[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listMujtahidRepsByWorkspace(tenant);
}

export async function replaceMujtahidReps(records: MujtahidRep[]): Promise<MujtahidRep[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = mujtahidRepListSchema.parse(records);
  await replaceMujtahidRepsForWorkspace(tenant, parsed);
  await broadcast('mujtahid_reps');
  return parsed;
}

// --- Wakala Types ---
export async function loadWakalaTypes(): Promise<WakalaType[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listWakalaTypesByWorkspace(tenant);
}

export async function replaceWakalaTypes(records: WakalaType[]): Promise<WakalaType[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = wakalaTypeListSchema.parse(records);
  await replaceWakalaTypesForWorkspace(tenant, parsed);
  await broadcast('wakala_types');
  return parsed;
}

// --- Obligation Distributions ---
export async function loadObligationDistributions(): Promise<ObligationDistribution[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listObligationDistributionsByWorkspace(tenant);
}

export async function replaceObligationDistributions(records: ObligationDistribution[]): Promise<ObligationDistribution[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = obligationDistributionListSchema.parse(records);
  await replaceObligationDistributionsForWorkspace(tenant, parsed);
  await broadcast('obligation_distributions');
  return parsed;
}

// --- Obligation Collections ---
export async function loadObligationCollections(): Promise<ObligationCollection[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listObligationCollectionsByWorkspace(tenant);
}

export async function replaceObligationCollections(records: ObligationCollection[]): Promise<ObligationCollection[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = obligationCollectionListSchema.parse(records);
  await replaceObligationCollectionsForWorkspace(tenant, parsed);
  await broadcast('obligation_collections');
  return parsed;
}
