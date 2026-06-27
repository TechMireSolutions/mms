import {
  type ObligationType,
  type Mujtahid,
  type MujtahidRep,
  type WakalaType,
  type ObligationDistribution,
  type ObligationCollection,
  obligationTypeListSchema,
  obligationTypeRecordSchema,
  mujtahidListSchema,
  mujtahidRecordSchema,
  mujtahidRepListSchema,
  mujtahidRepRecordSchema,
  wakalaTypeListSchema,
  wakalaTypeRecordSchema,
  obligationDistributionListSchema,
  obligationDistributionRecordSchema,
  obligationCollectionListSchema,
  obligationCollectionRecordSchema,
} from '@mms/shared';
import { defineCollectionCrudService } from './collectionCrudService.js';
import { persistCollection } from './dbSyncService.js';

const TYPES_COLLECTION = 'obligation_types';
const MUJTAHIDS_COLLECTION = 'mujtahids';
const REPS_COLLECTION = 'mujtahid_reps';
const WAKALA_COLLECTION = 'wakala_types';
const DISTRIBUTIONS_COLLECTION = 'obligation_distributions';
const COLLECTIONS_COLLECTION = 'obligation_collections';

// --- Obligation Types ---
const normalizeType = (record: ObligationType) => obligationTypeRecordSchema.parse(record);
const typeCrud = defineCollectionCrudService(TYPES_COLLECTION, obligationTypeListSchema, normalizeType);
export const loadObligationTypes = typeCrud.load;
export async function replaceObligationTypes(records: ObligationType[]): Promise<ObligationType[]> {
  const parsed = obligationTypeListSchema.parse(records);
  await persistCollection(TYPES_COLLECTION, parsed);
  return parsed;
}

// --- Mujtahids ---
const normalizeMujtahid = (record: Mujtahid) => mujtahidRecordSchema.parse(record);
const mujtahidCrud = defineCollectionCrudService(MUJTAHIDS_COLLECTION, mujtahidListSchema, normalizeMujtahid);
export const loadMujtahids = mujtahidCrud.load;
export async function replaceMujtahids(records: Mujtahid[]): Promise<Mujtahid[]> {
  const parsed = mujtahidListSchema.parse(records);
  await persistCollection(MUJTAHIDS_COLLECTION, parsed);
  return parsed;
}

// --- Mujtahid Reps ---
const normalizeRep = (record: MujtahidRep) => mujtahidRepRecordSchema.parse(record);
const repCrud = defineCollectionCrudService(REPS_COLLECTION, mujtahidRepListSchema, normalizeRep);
export const loadMujtahidReps = repCrud.load;
export async function replaceMujtahidReps(records: MujtahidRep[]): Promise<MujtahidRep[]> {
  const parsed = mujtahidRepListSchema.parse(records);
  await persistCollection(REPS_COLLECTION, parsed);
  return parsed;
}

// --- Wakala Types ---
const normalizeWakala = (record: WakalaType) => wakalaTypeRecordSchema.parse(record);
const wakalaCrud = defineCollectionCrudService(WAKALA_COLLECTION, wakalaTypeListSchema, normalizeWakala);
export const loadWakalaTypes = wakalaCrud.load;
export async function replaceWakalaTypes(records: WakalaType[]): Promise<WakalaType[]> {
  const parsed = wakalaTypeListSchema.parse(records);
  await persistCollection(WAKALA_COLLECTION, parsed);
  return parsed;
}

// --- Obligation Distributions ---
const normalizeDistribution = (record: ObligationDistribution) => obligationDistributionRecordSchema.parse(record);
const distributionCrud = defineCollectionCrudService(DISTRIBUTIONS_COLLECTION, obligationDistributionListSchema, normalizeDistribution);
export const loadObligationDistributions = distributionCrud.load;
export async function replaceObligationDistributions(records: ObligationDistribution[]): Promise<ObligationDistribution[]> {
  const parsed = obligationDistributionListSchema.parse(records);
  await persistCollection(DISTRIBUTIONS_COLLECTION, parsed);
  return parsed;
}

// --- Obligation Collections ---
const normalizeCollection = (record: ObligationCollection) => obligationCollectionRecordSchema.parse(record);
const collectionCrud = defineCollectionCrudService(COLLECTIONS_COLLECTION, obligationCollectionListSchema, normalizeCollection);
export const loadObligationCollections = collectionCrud.load;
export async function replaceObligationCollections(records: ObligationCollection[]): Promise<ObligationCollection[]> {
  const parsed = obligationCollectionListSchema.parse(records);
  await persistCollection(COLLECTIONS_COLLECTION, parsed);
  return parsed;
}
