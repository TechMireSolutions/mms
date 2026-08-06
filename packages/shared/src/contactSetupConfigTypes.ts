import { z } from 'zod';

/** PUT /api/contacts/field-config — FieldConfig JSON without formTabs SSOT. */
export const contactFieldConfigPutBodySchema = z
  .object({
    version: z.number().optional(),
    enabledTabs: z.array(z.string()).optional(),
    requiredTabs: z.array(z.string()).optional(),
    fields: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))).optional(),
  })
  .passthrough();

const relationshipPairSchema = z
  .object({
    id: z.string().optional(),
    forward: z.string().min(1),
    inverse: z.string().min(1),
    inverseMale: z.string().optional(),
    inverseFemale: z.string().optional(),
  })
  .strict();

/** PUT /api/contacts/preferences — ContactPreferences JSON. */
export const contactPreferencesPutBodySchema = z
  .object({
    defaultCountry: z.string().optional(),
    defaultProvince: z.string().optional(),
    defaultCity: z.string().optional(),
    relationshipPairs: z.array(relationshipPairSchema).optional(),
  })
  .passthrough();
