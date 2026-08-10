import { z } from 'zod';
import { softDeleteBodySchema } from './commonSchemas.js';
import { csvExportBodySchema, moduleExportAuditBodySchema, moduleSetupAuditBodySchema } from './csvExportBodySchema.js';
import {
  phoneNumberSchema,
  emailAddressSchema,
  addressSchema,
  socialLinkSchema,
  relationshipContactSchema,
  relationshipSchema,
  activitySchema,
  attachmentSchema,
  contactRecordSchema,
  contactWriteSchema,
  buildContactWriteSchema,
  collectContactWriteExtraFieldKeys,
  contactListSchema,
  contactsListQuerySchema,
  contactFieldUsageParamsSchema,
  contactFieldUsageBatchBodySchema,
} from '@mms/shared';

export {
  phoneNumberSchema,
  emailAddressSchema,
  addressSchema,
  socialLinkSchema,
  relationshipContactSchema,
  relationshipSchema,
  activitySchema,
  attachmentSchema,
  contactRecordSchema,
  contactWriteSchema,
  buildContactWriteSchema,
  collectContactWriteExtraFieldKeys,
  contactListSchema,
  contactsListQuerySchema,
  contactFieldUsageParamsSchema,
  contactFieldUsageBatchBodySchema,
};

export const contactDeleteBodySchema = softDeleteBodySchema;

export const contactExportAuditSchema = moduleExportAuditBodySchema;

export function buildContactMergeBodySchema(extraFieldKeys: string[] = []) {
  return z.object({
    keepId: z.union([z.string(), z.number()]),
    deleteId: z.union([z.string(), z.number()]),
    merged: buildContactWriteSchema(extraFieldKeys).optional(),
  });
}

/** System-keys-only merge body — prefer `buildContactMergeBodySchema` on tenant writes. */
export const contactMergeBodySchema = buildContactMergeBodySchema();

export const contactsWorkDrillDownSchema = z.object({
  gender: z.string().optional(),
  search: z.string().max(500).optional(),
});

export const contactsSavedReportCreateSchema = z.object({
  name: z.string().min(1).max(200),
  drillDown: contactsWorkDrillDownSchema,
  shareScope: z.enum(['private', 'roles', 'users', 'global']).optional(),
  sharedWithRoles: z.array(z.string()).optional(),
  sharedWithUserIds: z.array(z.string()).optional(),
});

export const contactGoogleSyncConfigSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  clearTokens: z.boolean().optional(),
});

/** Client-initiated Google sync audits (run/oauth exchange audit server-side). */
export const contactGoogleSyncAuditSchema = z.object({
  action: z.enum(['credentials_saved', 'disconnected']),
});

export const contactGoogleSyncExchangeSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
});

export const contactsDuplicatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const contactSetupAuditSchema = moduleSetupAuditBodySchema;

export const contactsCsvExportBodySchema = csvExportBodySchema(contactsListQuerySchema);

export const contactsVcfExportBodySchema = z.object({
  filename: z.string().min(1).max(200).optional(),
  label: z.string().min(1).max(500).optional(),
  idempotencyKey: z
    .string()
    .min(8)
    .max(128)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
});

export const contactsDuplicateScanBodySchema = z.object({
  label: z.string().min(1).max(500).optional(),
  idempotencyKey: z
    .string()
    .min(8)
    .max(128)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
});

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

export function buildContactDuplicateCheckBodySchema(extraFieldKeys: string[] = []) {
  return z.object({
    contact: buildContactWriteSchema(extraFieldKeys),
  });
}

export const contactDuplicateCheckBodySchema = buildContactDuplicateCheckBodySchema();
