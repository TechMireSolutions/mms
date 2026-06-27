import {
  examRecordSchema as sharedExamRecordSchema,
  examListSchema as sharedExamListSchema,
  examResultRecordSchema as sharedExamResultRecordSchema,
  examResultListSchema as sharedExamResultListSchema,
} from '@mms/shared';

export const examRecordSchema = sharedExamRecordSchema.passthrough();
export const examListSchema = sharedExamListSchema;

export const examResultRecordSchema = sharedExamResultRecordSchema.passthrough();
export const examResultListSchema = sharedExamResultListSchema;
