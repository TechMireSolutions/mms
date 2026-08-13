import { z } from 'zod';

export const FIELD_TYPE = z.enum([
  'text',
  'textarea',
  'number',
  'date',
  'url',
  'email',
  'select',
  'tags',
  'boolean',
  'currency',
  'phone',
  'file',
  'rating',
  'datetime',
]);
export type FieldType = z.infer<typeof FIELD_TYPE>;

export const customFieldConfigSchema = z
  .object({
    id: z.string().uuid(),
    tabId: z.string().uuid(),
    key: z.string().min(1, 'Field key is required'),
    label: z.string().min(2, 'Label must be at least 2 characters'),
    type: FIELD_TYPE,
    enabled: z.boolean().default(true),
    required: z.boolean().default(false),
    unique: z.boolean().default(false),
    placeholder: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    defaultValue: z.string().nullable().optional(),
    options: z.array(z.string()).nullable().optional(),
    minValue: z.number().nullable().optional(),
    maxValue: z.number().nullable().optional(),
    mask: z.string().nullable().optional(),
    allowedExtensions: z.string().nullable().optional(),
    maxFileSize: z.number().nullable().optional(),
    sortOrder: z.number().default(0),
    hasData: z.boolean().optional().default(false),
    isSystem: z.boolean().optional().default(false),
  })
  .strict();
export type CustomFieldConfig = z.infer<typeof customFieldConfigSchema>;

/**
 * PATCH `/modules/:module/tabs/:tabId/fields/:fieldId` write DTO.
 * Every field optional (partial update); no defaults so absent keys are `undefined`
 * and the handler can fall back to the existing row value via `??`.
 * `.strict()` — unknown keys must not persist.
 */
export const updateFieldBodySchema = z
  .object({
    key: z.string().min(1).optional(),
    label: z.string().min(2).optional(),
    type: FIELD_TYPE.optional(),
    enabled: z.boolean().optional(),
    required: z.boolean().optional(),
    unique: z.boolean().optional(),
    placeholder: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    defaultValue: z.string().nullable().optional(),
    options: z.array(z.string()).nullable().optional(),
    minValue: z.number().nullable().optional(),
    maxValue: z.number().nullable().optional(),
    mask: z.string().nullable().optional(),
    allowedExtensions: z.string().nullable().optional(),
    maxFileSize: z.number().nullable().optional(),
    sortOrder: z.number().optional(),
  })
  .strict();

export const tabConfigSchema = z
  .object({
    id: z.string().uuid(),
    key: z.string().min(1, 'Tab key is required'),
    label: z.string().min(1, 'Tab label is required'),
    enabled: z.boolean().default(true),
    required: z.boolean().default(false),
    sortOrder: z.number().default(0),
    isSystem: z.boolean().default(false),
    fields: z.array(customFieldConfigSchema).default([]),
  })
  .strict();
export type TabConfig = z.infer<typeof tabConfigSchema>;
