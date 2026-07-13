import { z } from 'zod';

export const customTabSchema = z.object({
  moduleId: z.string().min(1),
  key: z.string().min(1).regex(/^[a-z0-9_]+$/i, 'Key must be alphanumeric/underscores only'),
  label: z.string().min(1),
  icon: z.string().nullable().optional(),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  permissions: z.array(z.string()).nullable().optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  isSystem: z.boolean().default(false),
});

export const customTabUpdateSchema = customTabSchema.partial().omit({ moduleId: true, key: true });

export const customTabListSchema = z.array(customTabSchema);

export const customTabBulkSaveSchema = z.object({
  moduleId: z.string().min(1),
  tabs: z.array(
    customTabSchema.omit({ moduleId: true }).extend({
      sortOrder: z.number().int().optional(),
    })
  ),
});

export const customTabQuerySchema = z.object({
  moduleId: z.string().optional(),
});
