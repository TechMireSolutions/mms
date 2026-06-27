import {
  denomRecordSchema as sharedDenomRecordSchema,
  denomListSchema as sharedDenomListSchema,
  batchRecordSchema as sharedBatchRecordSchema,
  batchListSchema as sharedBatchListSchema,
  distributionRecordSchema as sharedDistributionRecordSchema,
  distributionListSchema as sharedDistributionListSchema,
  redemptionRecordSchema as sharedRedemptionRecordSchema,
  redemptionListSchema as sharedRedemptionListSchema,
} from '@mms/shared';

export const denomRecordSchema = sharedDenomRecordSchema.passthrough();
export const denomListSchema = sharedDenomListSchema;

export const batchRecordSchema = sharedBatchRecordSchema.passthrough();
export const batchListSchema = sharedBatchListSchema;

export const distributionRecordSchema = sharedDistributionRecordSchema.passthrough();
export const distributionListSchema = sharedDistributionListSchema;

export const redemptionRecordSchema = sharedRedemptionRecordSchema.passthrough();
export const redemptionListSchema = sharedRedemptionListSchema;
