import { z } from 'zod';
import { moduleFieldConfigPutBodySchema } from './moduleFieldConfigPutBodySchema.js';

/** PUT /api/contacts/field-config — FieldConfig JSON without formTabs SSOT. */
export const contactFieldConfigPutBodySchema = moduleFieldConfigPutBodySchema;
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
