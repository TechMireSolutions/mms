import { describe, expect, it } from 'vitest';
import { syncStudentColumnRegistryWithFields } from './studentColumnRegistrySync.js';
import { DEFAULT_STUDENT_COLUMN_REGISTRY } from './moduleFieldSetupPersons.js';
import type { FieldDefinition } from './contactTypes.js';

const baseFields: Record<string, FieldDefinition[]> = {
  basic: [
    { key: 'contactId', label: 'Contact', type: 'text', enabled: true, order: 0 },
    { key: 'gender', label: 'Gender', type: 'select', enabled: true, order: 1 },
    { key: 'dob', label: 'DOB', type: 'date', enabled: true, order: 2 },
    { key: 'contactRelationships', label: 'Parents', type: 'text', enabled: true, order: 3 },
  ],
  registration: [
    { key: 'grNumber', label: 'GR', type: 'text', enabled: true, order: 0 },
    { key: 'status', label: 'Status', type: 'select', enabled: true, order: 1 },
    { key: 'registeredDate', label: 'Registered', type: 'date', enabled: true, order: 2 },
    { key: 'notes', label: 'Notes', type: 'textarea', enabled: true, order: 3 },
  ],
};

describe('syncStudentColumnRegistryWithFields', () => {
  it('disables mapped columns when the governing tab is off', () => {
    const next = syncStudentColumnRegistryWithFields(
      DEFAULT_STUDENT_COLUMN_REGISTRY,
      baseFields,
      [],
    );
    expect(next.find((col) => col.key === 'status')?.enabled).toBe(false);
    expect(next.find((col) => col.key === 'dob')?.enabled).toBe(true);
  });

  it('adds custom columns for enabled non-seed fields and drops them when disabled', () => {
    const withCustom: Record<string, FieldDefinition[]> = {
      ...baseFields,
      basic: [
        ...baseFields.basic,
        { key: 'scholarship', label: 'Scholarship', type: 'text', enabled: true, order: 10 },
      ],
    };
    const next = syncStudentColumnRegistryWithFields(
      DEFAULT_STUDENT_COLUMN_REGISTRY,
      withCustom,
      ['registration'],
    );
    expect(next.find((col) => col.key === 'custom:scholarship')?.enabled).toBe(true);

    const withoutCustom = syncStudentColumnRegistryWithFields(
      next,
      baseFields,
      ['registration'],
    );
    expect(withoutCustom.find((col) => col.key === 'custom:scholarship')).toBeUndefined();
  });
});
