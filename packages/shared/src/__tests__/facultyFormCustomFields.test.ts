import { describe, expect, it } from 'vitest';
import {
  isFacultySystemFormField,
  listEnabledCustomFacultyFormFields,
  listFacultySystemFormFieldKeys,
} from '../facultyFormCustomFields.js';
import { findFacultySeedField } from '../moduleFieldSetupFaculty.js';
import type { FieldDefinition } from '../contactFieldSchemaTypes.js';

function field(partial: Partial<FieldDefinition> & { key: string }): FieldDefinition {
  return {
    label: partial.key,
    type: 'text',
    enabled: true,
    order: 0,
    required: false,
    permissions: [],
    defaultValue: '',
    ...partial,
  };
}

describe('listEnabledCustomFacultyFormFields', () => {
  it('scopes non-seed fields to the requested tab', () => {
    const fields = {
      basic: [field({ key: 'specialization', order: 0 }), field({ key: 'house', order: 10 })],
      employment: [field({ key: 'extraNote', order: 0 })],
    };

    expect(listEnabledCustomFacultyFormFields(fields, 'basic').map((f) => f.key)).toEqual(['house']);
    expect(listEnabledCustomFacultyFormFields(fields, 'employment').map((f) => f.key)).toEqual([
      'extraNote',
    ]);
  });

  it('excludes disabled and system seed keys', () => {
    const fields = {
      employment: [
        field({ key: 'status' }),
        field({ key: 'hiddenCustom', enabled: false }),
        field({ key: 'visibleCustom', enabled: true }),
      ],
    };

    expect(listEnabledCustomFacultyFormFields(fields, 'employment').map((f) => f.key)).toEqual([
      'visibleCustom',
    ]);
    expect(listFacultySystemFormFieldKeys().has('status')).toBe(true);
    expect(listFacultySystemFormFieldKeys().has('contactId')).toBe(true);
    expect(isFacultySystemFormField('basic', 'specialization')).toBe(true);
    expect(isFacultySystemFormField('employment', 'joinDate')).toBe(true);
  });

  it('aggregates all tabs when tabId is omitted', () => {
    const fields = {
      basic: [field({ key: 'onBasic', order: 2 })],
      employment: [field({ key: 'onEmployment', order: 1 })],
    };

    expect(listEnabledCustomFacultyFormFields(fields).map((f) => f.key)).toEqual([
      'onEmployment',
      'onBasic',
    ]);
  });
});

describe('findFacultySeedField', () => {
  it('finds a seeded faculty field across any tab', () => {
    expect(findFacultySeedField('contactId')?.key).toBe('contactId');
    expect(findFacultySeedField('employeeId')?.key).toBe('employeeId');
    expect(findFacultySeedField('status')?.labelKey).toBe('faculty.field.status');
  });

  it('returns undefined for unknown fields', () => {
    expect(findFacultySeedField('house')).toBeUndefined();
  });
});
