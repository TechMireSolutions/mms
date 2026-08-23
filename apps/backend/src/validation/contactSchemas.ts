import { z } from 'zod';
import { csvExportBodySchema, moduleSetupAuditBodySchema } from './csvExportBodySchema.js';
import {
  contactRecordSchema,
  contactsListQuerySchema,
  contactFieldUsageParamsSchema,
  contactFieldUsageBatchBodySchema,
  buildContactMergeBodySchema,
  contactsWorkDrillDownSchema,
  contactsSavedReportCreateSchema,
  contactGoogleSyncConfigSchema,
  contactGoogleSyncAuditSchema,
  contactGoogleSyncExchangeSchema,
  contactsVcfExportBodySchema,
  contactsDuplicateScanBodySchema,
  buildContactDuplicateCheckBodySchema,
} from '@mms/shared';

export {
  contactRecordSchema,
  contactsListQuerySchema,
  contactFieldUsageParamsSchema,
  contactFieldUsageBatchBodySchema,
  buildContactMergeBodySchema,
  contactsWorkDrillDownSchema,
  contactsSavedReportCreateSchema,
  contactGoogleSyncConfigSchema,
  contactGoogleSyncAuditSchema,
  contactGoogleSyncExchangeSchema,
  contactsVcfExportBodySchema,
  contactsDuplicateScanBodySchema,
  buildContactDuplicateCheckBodySchema,
};

export const contactsDuplicatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const contactSetupAuditSchema = moduleSetupAuditBodySchema;

export const contactsCsvExportBodySchema = csvExportBodySchema(contactsListQuerySchema);

export const contactsReportAnalyticsQuerySchema = z.object({
  years: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((year) => Number.parseInt(year.trim(), 10))
            .filter((year) => Number.isFinite(year) && year >= 1900 && year <= 2100)
        : [],
    ),
  lang: z.string().max(16).optional(),
});
