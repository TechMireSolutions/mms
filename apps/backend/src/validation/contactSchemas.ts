import { z } from 'zod';
import { baseListQuerySchema, softDeleteBodySchema } from './commonSchemas.js';
import {
  phoneNumberSchema,
  emailAddressSchema,
  addressSchema,
  socialLinkSchema,
  emergencyContactSchema,
  relationshipSchema,
  activitySchema,
  attachmentSchema,
  contactRecordSchema,
  contactListSchema,
} from '@mms/shared';

export {
  phoneNumberSchema,
  emailAddressSchema,
  addressSchema,
  socialLinkSchema,
  emergencyContactSchema,
  relationshipSchema,
  activitySchema,
  attachmentSchema,
  contactRecordSchema,
  contactListSchema,
};

export const contactBulkDeleteSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1),
  deletionReason: z.string().max(500).optional(),
});

export const contactDeleteBodySchema = softDeleteBodySchema;

export const contactExportAuditSchema = z.object({
  count: z.number().int().min(0).max(1_000_000),
  scope: z.enum(['all', 'filtered', 'selection']).optional(),
});

export const contactMergeAuditSchema = z.object({
  keepId: z.union([z.string(), z.number()]),
  deleteId: z.union([z.string(), z.number()]),
  mergedName: z.string().optional(),
});

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

export const contactGoogleSyncAuditSchema = z.object({
  action: z.enum(['credentials_saved', 'oauth_connected', 'sync_complete', 'disconnected']),
  imported: z.number().int().min(0).optional(),
  total: z.number().int().min(0).optional(),
  skipped: z.number().int().min(0).optional(),
});

export const contactGoogleSyncExchangeSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
});

export const contactsDuplicatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const contactsListQuerySchema = baseListQuerySchema.extend({
  gender: z.string().optional(),
  hasPhone: z
    .preprocess((val) => {
      if (val === undefined) return undefined;
      return val === 'true' || val === true;
    }, z.boolean())
    .optional(),
});

export const contactSetupAuditSchema = z.object({
  area: z.enum(['fields', 'preferences', 'sync']),
  summary: z.string().min(1).max(500),
});

const exportColumnSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
});

export const contactsCsvExportBodySchema = z.object({
  query: contactsListQuerySchema.optional(),
  columns: z.array(exportColumnSchema).max(50).optional(),
  filename: z.string().min(1).max(200).optional(),
  label: z.string().min(1).max(500).optional(),
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
});

export const contactFieldUsageParamsSchema = z.object({
  fieldKey: z.string().min(1).max(128),
});

export const contactDuplicateCheckBodySchema = z.object({
  contact: contactRecordSchema,
});
