import { describe, expect, it } from 'vitest';
import { syncContactColumnRegistryWithFields } from './contactColumnRegistrySync.js';
import { DEFAULT_COLUMN_REGISTRY } from './contactTabRegistry.js';

describe('syncContactColumnRegistryWithFields', () => {
  it('disables mapped columns when the governing tab is off', () => {
    const next = syncContactColumnRegistryWithFields(
      DEFAULT_COLUMN_REGISTRY,
      {
        phones: [{ key: 'number', label: 'Phone', type: 'text', enabled: true, order: 0 }],
      },
      ['emails', 'custom'],
    );
    expect(next.find((col) => col.key === 'phone')?.enabled).toBe(false);
  });

  it('disables mapped columns when the governing field is off', () => {
    const next = syncContactColumnRegistryWithFields(
      DEFAULT_COLUMN_REGISTRY,
      {
        basic: [
          { key: 'gender', label: 'Gender', type: 'select', enabled: false, order: 0 },
          { key: 'firstName', label: 'First', type: 'text', enabled: true, order: 1 },
        ],
      },
      ['phones', 'custom'],
    );
    expect(next.find((col) => col.key === 'gender')?.enabled).toBe(false);
    expect(next.find((col) => col.key === 'name')?.enabled).toBe(true);
  });

  it('restores default enabled when field/tab become active again', () => {
    const disabledPhone = DEFAULT_COLUMN_REGISTRY.map((col) =>
      col.key === 'phone' ? { ...col, enabled: false } : col,
    );
    const next = syncContactColumnRegistryWithFields(
      disabledPhone,
      {
        phones: [{ key: 'number', label: 'Phone', type: 'text', enabled: true, order: 0 }],
      },
      ['phones', 'custom'],
    );
    expect(next.find((col) => col.key === 'phone')?.enabled).toBe(true);
  });
});
