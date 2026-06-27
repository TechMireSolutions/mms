import {
  type Denomination,
  type StockBatch,
  type Distribution,
  type Redemption,
  denomListSchema,
  denomRecordSchema,
  batchListSchema,
  batchRecordSchema,
  distributionListSchema,
  distributionRecordSchema,
  redemptionListSchema,
  redemptionRecordSchema,
} from '@mms/shared';
import { defineCollectionCrudService } from './collectionCrudService.js';
import { persistCollection } from './dbSyncService.js';

const DENOMS_COLLECTION = 'hasanat_denoms';
const BATCHES_COLLECTION = 'hasanat_batches';
const DISTRIBUTIONS_COLLECTION = 'hasanat_distributions';
const REDEMPTIONS_COLLECTION = 'hasanat_redemptions';

// --- Denominations ---
const normalizeDenom = (record: Denomination) => denomRecordSchema.parse(record);
const denomCrud = defineCollectionCrudService(DENOMS_COLLECTION, denomListSchema, normalizeDenom);
export const loadDenoms = denomCrud.load;
export async function replaceDenoms(records: Denomination[]): Promise<Denomination[]> {
  const parsed = denomListSchema.parse(records);
  await persistCollection(DENOMS_COLLECTION, parsed);
  return parsed;
}

// --- Batches ---
const normalizeBatch = (record: StockBatch) => batchRecordSchema.parse(record);
const batchCrud = defineCollectionCrudService(BATCHES_COLLECTION, batchListSchema, normalizeBatch);
export const loadBatches = batchCrud.load;
export async function replaceBatches(records: StockBatch[]): Promise<StockBatch[]> {
  const parsed = batchListSchema.parse(records);
  await persistCollection(BATCHES_COLLECTION, parsed);
  return parsed;
}

// --- Distributions ---
const normalizeDist = (record: Distribution) => distributionRecordSchema.parse(record);
const distCrud = defineCollectionCrudService(DISTRIBUTIONS_COLLECTION, distributionListSchema, normalizeDist);
export const loadDistributions = distCrud.load;
export async function replaceDistributions(records: Distribution[]): Promise<Distribution[]> {
  const parsed = distributionListSchema.parse(records);
  await persistCollection(DISTRIBUTIONS_COLLECTION, parsed);
  return parsed;
}

// --- Redemptions ---
const normalizeRedemption = (record: Redemption) => redemptionRecordSchema.parse(record);
const redemptionCrud = defineCollectionCrudService(REDEMPTIONS_COLLECTION, redemptionListSchema, normalizeRedemption);
export const loadRedemptions = redemptionCrud.load;
export async function replaceRedemptions(records: Redemption[]): Promise<Redemption[]> {
  const parsed = redemptionListSchema.parse(records);
  await persistCollection(REDEMPTIONS_COLLECTION, parsed);
  return parsed;
}
