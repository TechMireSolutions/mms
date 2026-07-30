import { z } from 'zod';
import { messageCategorySchema } from './messagingCategorySchemas.js';

export const messageStatusSchema = z.enum(['queued', 'sent', 'delivered', 'failed', 'skipped']);

/** Max logs accepted in a single POST /api/messaging/logs body. */
export const MESSAGE_LOG_RECORD_BATCH_MAX = 500;

/** Default page size for messaging reports / log history. */
export const MESSAGE_LOGS_DEFAULT_PAGE_SIZE = 50;

/** Client-submitted dispatch attempt — server assigns id, userId, and sentAt. */
export const messageLogCreateSchema = z.object({
  contactId: z.union([z.string(), z.number()]),
  channel: z.enum(['sms', 'whatsapp', 'email']),
  body: z.string().min(1).max(10_000),
  status: z.enum(['sent', 'failed', 'skipped']).optional().default('sent'),
  subject: z.string().max(500).optional(),
  category: messageCategorySchema.optional().default('general'),
  errorMessage: z.string().max(1_000).optional(),
});

export const messageRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  contactId: z.union([z.string(), z.number()]),
  channel: z.enum(['sms', 'whatsapp', 'email']),
  body: z.string(),
  sentAt: z.string(),
  status: messageStatusSchema.optional().default('sent'),
  subject: z.string().optional(),
  category: messageCategorySchema.optional().default('general'),
  errorMessage: z.string().optional(),
  deletedAt: z.string().optional(),
});

export const recordMessageLogsSchema = z.object({
  logs: z.array(messageLogCreateSchema).min(1).max(MESSAGE_LOG_RECORD_BATCH_MAX),
});

export const messagingLogsQuerySchema = z.object({
  channel: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(500).optional().default(MESSAGE_LOGS_DEFAULT_PAGE_SIZE),
  includeDeleted: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => value === true || value === 'true'),
});

export const MESSAGING_RECIPIENT_ROLES = ['all', 'students', 'teachers', 'staff', 'contacts'] as const;
export const MESSAGING_RECIPIENT_GENDERS = ['all', 'male', 'female', 'unspecified'] as const;

/** Work-tab recipient directory query (server-paginated under messaging RBAC). */
export const messagingRecipientsQuerySchema = z.object({
  role: z.enum(MESSAGING_RECIPIENT_ROLES).optional().default('all'),
  gender: z.enum(MESSAGING_RECIPIENT_GENDERS).optional().default('all'),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(200).optional().default(50),
  hasPhone: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === true || value === 'true')),
  hasEmail: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === true || value === 'true')),
});

export const messagingMetricsSchema = z.object({
  total: z.number(),
  smsCount: z.number(),
  whatsappCount: z.number(),
  emailCount: z.number(),
  sentCount: z.number(),
  deliveredCount: z.number(),
  failedCount: z.number(),
  skippedCount: z.number(),
  queuedCount: z.number().optional(),
  successRate: z.number(),
  categoryBreakdown: z.record(messageCategorySchema, z.number()).optional(),
});

/** Client dispatch-log create payload (server assigns id/userId/sentAt). */
export type MessageLogCreateDto = z.infer<typeof messageLogCreateSchema>;
/** Recorded message dispatch history DTO payload structure. */
export type MessageRecordDto = z.infer<typeof messageRecordSchema>;
/** Canonical sent-message domain type (Zod-inferred). */
export type Message = MessageRecordDto;
/** Filter and pagination query parameters for message logs. */
export type MessagingLogsQueryDto = z.infer<typeof messagingLogsQuerySchema>;
/** Work recipient directory query parameters. */
export type MessagingRecipientsQueryDto = z.infer<typeof messagingRecipientsQuerySchema>;
/** Messaging volume and delivery metrics summary DTO. */
export type MessagingMetricsDto = z.infer<typeof messagingMetricsSchema>;
