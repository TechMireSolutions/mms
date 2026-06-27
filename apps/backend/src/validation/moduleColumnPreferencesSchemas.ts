import { z } from 'zod';

export const moduleColumnPrefSchema = z.object({
  key: z.string().min(1).max(64),
  enabled: z.boolean(),
  order: z.number().int().min(0),
});

export const moduleColumnPrefsBodySchema = z.object({
  prefs: z.array(moduleColumnPrefSchema).max(64),
});
