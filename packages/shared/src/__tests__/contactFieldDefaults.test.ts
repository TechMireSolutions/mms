import { describe, expect, it } from 'vitest';
import {
  getDefaultFieldValue,
  getDefaultModuleFieldValue,
} from '../contactFieldDefaults.js';
import type { FieldDefinition } from '../contactFieldSchemaTypes.js';

function makeField(type: FieldDefinition['type'], overrides: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    key: 'field',
    label: 'Field',
    type,
    enabled: true,
    order: 0,
    ...overrides,
  };
}

describe('getDefaultFieldValue', () => {
  it('respects an explicit defaultValue', () => {
    expect(getDefaultFieldValue(makeField('text', { defaultValue: 'seed' }))).toBe('seed');
    expect(getDefaultFieldValue(makeField('number', { defaultValue: 0 }))).toBe(0);
  });

  it('ignores null defaultValue and falls through to the type default', () => {
    expect(getDefaultFieldValue(makeField('text', { defaultValue: null }))).toBe('');
  });

  it('maps scalar types to null', () => {
    for (const type of ['number', 'boolean', 'date', 'datetime', 'location', 'file'] as const) {
      expect(getDefaultFieldValue(makeField(type))).toBeNull();
    }
  });

  it('maps multi-value types to empty arrays', () => {
    for (const type of ['multiselect', 'multi_select', 'tags'] as const) {
      expect(getDefaultFieldValue(makeField(type))).toEqual([]);
    }
  });

  it('defaults other types to empty string', () => {
    for (const type of ['text', 'textarea', 'select', 'url', 'email'] as const) {
      expect(getDefaultFieldValue(makeField(type))).toBe('');
    }
  });
});

describe('getDefaultModuleFieldValue', () => {
  it('defaults the type to text when absent', () => {
    expect(getDefaultModuleFieldValue({ id: 'm1' })).toBe('');
  });

  it('passes an explicit defaultValue through', () => {
    expect(getDefaultModuleFieldValue({ id: 'm1', type: 'select', defaultValue: 'a' })).toBe('a');
  });

  it('maps numeric module fields to null', () => {
    expect(getDefaultModuleFieldValue({ id: 'm1', type: 'number' })).toBeNull();
  });
});
