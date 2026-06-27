import {
  obligationTypeRecordSchema as sharedObligationTypeRecordSchema,
  obligationTypeListSchema as sharedObligationTypeListSchema,
  mujtahidRecordSchema as sharedMujtahidRecordSchema,
  mujtahidListSchema as sharedMujtahidListSchema,
  mujtahidRepRecordSchema as sharedMujtahidRepRecordSchema,
  mujtahidRepListSchema as sharedMujtahidRepListSchema,
  wakalaTypeRecordSchema as sharedWakalaTypeRecordSchema,
  wakalaTypeListSchema as sharedWakalaTypeListSchema,
  obligationDistributionRecordSchema as sharedObligationDistributionRecordSchema,
  obligationDistributionListSchema as sharedObligationDistributionListSchema,
  obligationCollectionRecordSchema as sharedObligationCollectionRecordSchema,
  obligationCollectionListSchema as sharedObligationCollectionListSchema,
} from '@mms/shared';

export const obligationTypeRecordSchema = sharedObligationTypeRecordSchema.passthrough();
export const obligationTypeListSchema = sharedObligationTypeListSchema;

export const mujtahidRecordSchema = sharedMujtahidRecordSchema.passthrough();
export const mujtahidListSchema = sharedMujtahidListSchema;

export const mujtahidRepRecordSchema = sharedMujtahidRepRecordSchema.passthrough();
export const mujtahidRepListSchema = sharedMujtahidRepListSchema;

export const wakalaTypeRecordSchema = sharedWakalaTypeRecordSchema.passthrough();
export const wakalaTypeListSchema = sharedWakalaTypeListSchema;

export const obligationDistributionRecordSchema = sharedObligationDistributionRecordSchema.passthrough();
export const obligationDistributionListSchema = sharedObligationDistributionListSchema;

export const obligationCollectionRecordSchema = sharedObligationCollectionRecordSchema.passthrough();
export const obligationCollectionListSchema = sharedObligationCollectionListSchema;
