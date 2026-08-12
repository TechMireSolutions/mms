import { describe, it, expect } from 'vitest';
import { buildDynamicValidationSchema } from './dynamicSchemaBuilder.js';
import { customFieldConfigSchema, type CustomFieldConfig } from '../schemas/dynamicFormSchemas.js';

describe('buildDynamicValidationSchema', () => {
  it('builds a Zod schema for text, number, boolean, select, and currency fields', () => {
    const fields: CustomFieldConfig[] = [
      customFieldConfigSchema.parse({
        id: '11111111-1111-4111-8111-111111111111',
        tabId: '22222222-2222-4222-8222-222222222222',
        key: 'custom_notes',
        label: 'Notes',
        type: 'text',
        enabled: true,
        required: true,
        sortOrder: 1,
      }),
      customFieldConfigSchema.parse({
        id: '33333333-3333-4333-8333-333333333333',
        tabId: '22222222-2222-4222-8222-222222222222',
        key: 'custom_amount',
        label: 'Fee Amount',
        type: 'currency',
        enabled: true,
        required: false,
        sortOrder: 2,
      }),
      customFieldConfigSchema.parse({
        id: '44444444-4444-4444-8444-444444444444',
        tabId: '22222222-2222-4222-8222-222222222222',
        key: 'custom_category',
        label: 'Category',
        type: 'select',
        enabled: true,
        options: ['General', 'Special', 'General'],
        sortOrder: 3,
      }),
    ];

    const schema = buildDynamicValidationSchema(fields);

    // Valid object
    const valid = schema.safeParse({
      custom_notes: 'Some notes',
      custom_amount: '150.50',
      custom_category: 'Special',
    });
    expect(valid.success).toBe(true);

    // Valid object with additional entity properties (e.g. firstName)
    const validWithEntityData = schema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      custom_notes: 'Some notes',
      custom_amount: '150.50',
      custom_category: 'Special',
    });
    expect(validWithEntityData.success).toBe(true);

    // Missing required field
    const invalidRequired = schema.safeParse({
      custom_notes: '',
      custom_amount: '150.50',
    });
    expect(invalidRequired.success).toBe(false);

    // Invalid currency float
    const invalidCurrency = schema.safeParse({
      custom_notes: 'Notes',
      custom_amount: '150.509',
    });
    expect(invalidCurrency.success).toBe(false);
  });
});

