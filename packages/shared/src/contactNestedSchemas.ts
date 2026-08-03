import { z } from 'zod';

const whatsappStatusSchema = z.enum(['PENDING', 'REGISTERED', 'NOT_REGISTERED', 'FAILED']);

export const phoneNumberSchema = z
  .object({
    label: z.string().optional(),
    number: z.string(),
    countryCode: z.string().optional(),
    isPrimary: z.boolean().optional(),
    whatsappStatus: whatsappStatusSchema.optional(),
  })
  .strict();

export const emailAddressSchema = z
  .object({
    label: z.string().optional(),
    address: z.string(),
    isPrimary: z.boolean().optional(),
    isVerified: z.boolean().optional(),
  })
  .strict();

export const addressSchema = z
  .object({
    label: z.string().optional(),
    line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    isPrimary: z.boolean().optional(),
  })
  .strict();

export const socialLinkSchema = z
  .object({
    platform: z.string(),
    url: z.string(),
  })
  .strict();

export const relationshipContactSchema = z
  .object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phone: z.string().optional(),
    contactId: z.union([z.string(), z.number()]).optional(),
    inferred: z.boolean().optional(),
    inferredFromContactId: z.union([z.string(), z.number()]).optional(),
    inferenceDepth: z.number().optional(),
  })
  .strict();

export const relationshipSchema = z
  .object({
    contactId: z.union([z.string(), z.number()]),
    relationship: z.string().optional(),
    notes: z.string().optional(),
  })
  .strict();

export const activitySchema = z
  .object({
    id: z.string(),
    type: z.enum(['note', 'stage_change', 'whatsapp', 'email', 'system', 'task', 'call']),
    content: z.string(),
    date: z.string(),
    by: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const attachmentSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string(),
    date: z.string(),
  })
  .strict();
