import { z } from 'zod';
import { messageCategorySchema, messageChannelSchema } from '../messagingCategorySchemas.js';
import { type MessageCategory, type MessageChannel } from '../messagingCategorySchemas.js';
import { deepSanitizeStrings } from './sanitize.js';

const messageTemplateInputBaseSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().min(1).max(200),
    labelKey: z.string().optional(),
    body: z.string().min(1).max(10_000),
    category: messageCategorySchema.default('general'),
    channel: messageChannelSchema.default('all'),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export const messageTemplateInputSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, messageTemplateInputBaseSchema);

/** Message template creation/update input payload structure. */
export type MessageTemplateInputDto = z.infer<typeof messageTemplateInputBaseSchema>;

export const messageTemplateInsertSchema = messageTemplateInputSchema;
export type MessageTemplateInsert = z.infer<typeof messageTemplateInputBaseSchema>;

export const messageTemplateUpdateSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, messageTemplateInputBaseSchema.partial().strict());



/** Message template DTO payload structure. */
export type MessageTemplateDto = {
  id: string;
  label: string;
  labelKey?: string;
  body: string;
  category: MessageCategory;
  channel: MessageChannel;
  createdAt?: string;
  updatedAt?: string;
};
/** Canonical message template domain type (Zod-inferred). */
export type MessageTemplate = MessageTemplateDto;
