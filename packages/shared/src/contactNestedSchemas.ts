import { z } from 'zod';

export const phoneNumberSchema = z
  .object({
    label: z.string().optional(),
    number: z.string(),
    countryCode: z.string().optional(),
  })
  .passthrough();

export const emailAddressSchema = z
  .object({
    label: z.string().optional(),
    address: z.string(),
  })
  .passthrough();

export const addressSchema = z
  .object({
    label: z.string().optional(),
    line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  })
  .passthrough();

export const socialLinkSchema = z
  .object({
    platform: z.string(),
    url: z.string(),
  })
  .passthrough();

export const relationshipContactSchema = z
  .object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phone: z.string().optional(),
    contactId: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export const relationshipSchema = z.object({
  contactId: z.union([z.string(), z.number()]),
  relationship: z.string().optional(),
});

export const activitySchema = z
  .object({
    id: z.string(),
    type: z.enum(['note', 'stage_change', 'whatsapp', 'email', 'system', 'task', 'call']),
    content: z.string(),
    date: z.string(),
    by: z.string().optional(),
  })
  .passthrough();

export const attachmentSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string(),
    date: z.string(),
  })
  .passthrough();
