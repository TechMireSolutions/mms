import { describe, it, expect } from 'vitest';
import { buildDynamicContactSchema } from '../contactValidation.js';
import type { FieldConfig } from '../contactTypes.js';

describe('buildDynamicContactSchema', () => {
  it('should validate contact record with custom fields', () => {
    const config: FieldConfig = {
      version: 1,
      enabledTabs: ['basic', 'phones'],
      requiredTabs: ['phones'],
      fields: {
        basic: [
          {
            key: 'firstName',
            label: 'First Name',
            type: 'text',
            enabled: true,
            order: 1,
            required: true,
          },
          {
            key: 'customText',
            label: 'Custom Text',
            type: 'text',
            enabled: true,
            order: 2,
            required: true,
            minLength: 3,
          }
        ],
        phones: [
          {
            key: 'number',
            label: 'Number',
            type: 'text',
            enabled: true,
            order: 1,
            required: true,
          }
        ]
      }
    };

    const schema = buildDynamicContactSchema(
      config,
      new Set(config.enabledTabs),
      new Set(config.requiredTabs),
      config.fields,
      'en'
    );

    // Valid data
    const validResult = schema.safeParse({
      firstName: 'John',
      customText: 'Hello',
      phones: [{ number: '123456789' }]
    });
    expect(validResult.success).toBe(true);

    // Invalid data - customText too short, phones empty
    const invalidResult = schema.safeParse({
      firstName: 'John',
      customText: 'Hi',
      phones: []
    });
    expect(invalidResult.success).toBe(false);
  });

  it('should support single_select and multi_select field types', () => {
    const config: FieldConfig = {
      version: 1,
      enabledTabs: ['basic'],
      requiredTabs: [],
      fields: {
        basic: [
          {
            key: 'firstName',
            label: 'First Name',
            type: 'text',
            enabled: true,
            order: 1,
            required: true,
          },
          {
            key: 'mySelect',
            label: 'My Select',
            type: 'single_select',
            options: ['Option A', 'Option B'],
            enabled: true,
            order: 2,
            required: true,
          },
          {
            key: 'myMultiSelect',
            label: 'My Multi Select',
            type: 'multi_select',
            options: ['X', 'Y', 'Z'],
            enabled: true,
            order: 3,
            required: true,
          }
        ]
      }
    };

    const schema = buildDynamicContactSchema(
      config,
      new Set(config.enabledTabs),
      new Set(config.requiredTabs),
      config.fields,
      'en'
    );

    // Valid
    const valid = schema.safeParse({
      firstName: 'John',
      mySelect: 'Option A',
      myMultiSelect: ['X', 'Y']
    });
    expect(valid.success).toBe(true);

    // Invalid select value
    const invalidSelect = schema.safeParse({
      firstName: 'John',
      mySelect: 'Option C',
      myMultiSelect: ['X']
    });
    expect(invalidSelect.success).toBe(false);

    // Invalid multi_select value
    const invalidMulti = schema.safeParse({
      firstName: 'John',
      mySelect: 'Option A',
      myMultiSelect: ['W']
    });
    expect(invalidMulti.success).toBe(false);
  });
});
