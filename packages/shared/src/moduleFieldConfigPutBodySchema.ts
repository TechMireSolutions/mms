import { z } from 'zod';

/** Shared Setup field-config PUT core (Contacts/Students). */
export const moduleFieldConfigPutBodySchema = z
  .object({
    version: z.number().optional(),
    enabledTabs: z.array(z.string()).optional(),
    requiredTabs: z.array(z.string()).optional(),
    fields: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))).optional(),
  })
  .passthrough();
