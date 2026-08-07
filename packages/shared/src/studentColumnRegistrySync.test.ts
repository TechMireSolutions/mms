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
    expect(next.find((col) => col.key === 'grNumber')?.enabled).toBe(false);
    expect(next.find((col) => col.key === 'registeredDate')?.enabled).toBe(false);
    expect(next.find((col) => col.key === 'notes')?.enabled).toBe(false);
    expect(next.find((col) => col.key === 'dob')?.enabled).toBe(true);
    expect(next.find((col) => col.key === 'gender')?.enabled).toBe(true);
  });

  it('disables mapped columns when the governing field is off', () => {
    const fields = {
      ...baseFields,
      basic: baseFields.basic.map((field) =>
        field.key === 'dob' ? { ...field, enabled: false } : field,
      ),
      registration: baseFields.registration.map((field) =>
        field.key === 'grNumber' ? { ...field, enabled: false } : field,
      ),
    };
    const next = syncStudentColumnRegistryWithFields(
      DEFAULT_STUDENT_COLUMN_REGISTRY,
      fields,
      ['registration'],
    );
    expect(next.find((col) => col.key === 'dob')?.enabled).toBe(false);
    expect(next.find((col) => col.key === 'grNumber')?.enabled).toBe(false);
    expect(next.find((col) => col.key === 'name')?.enabled).toBe(true);
    expect(next.find((col) => col.key === 'phone')?.enabled).toBe(true);
  });

  it('keeps unmapped Work chrome columns when Setup fields change', () => {
    const next = syncStudentColumnRegistryWithFields(
      DEFAULT_STUDENT_COLUMN_REGISTRY,
      baseFields,
      ['registration'],
    );
    expect(next.find((col) => col.key === 'phone')?.enabled).toBe(true);
    expect(next.find((col) => col.key === 'email')?.enabled).toBe(true);
    expect(next.find((col) => col.key === 'sessions')?.enabled).toBe(true);
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

  it('drops legacy column keys not in the Work registry', () => {
    const next = syncStudentColumnRegistryWithFields(
      [
        ...DEFAULT_STUDENT_COLUMN_REGISTRY,
        { key: 'legacyFatherName', label: 'Legacy', enabled: true, order: 99 },
      ],
      baseFields,
      ['registration'],
    );
    expect(next.find((col) => col.key === 'legacyFatherName')).toBeUndefined();
    expect(next.find((col) => col.key === 'grNumber')?.enabled).toBe(true);
  });
});
