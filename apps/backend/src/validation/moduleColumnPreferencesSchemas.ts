import { z } from 'zod';

export const moduleColumnPreferenceSchema = z.object({
  key: z.string().min(1).max(64),
  enabled: z.boolean(),
  order: z.number().int().min(0),
  width: z.number().int().min(80).max(640).optional(),
});

export const moduleColumnPreferencesBodySchema = z.object({
  preferences: z.array(moduleColumnPreferenceSchema).max(64),
});
