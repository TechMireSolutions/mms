import { describe, expect, it } from 'vitest';
import {
  isTeacherSystemFormField,
  listEnabledCustomTeacherFormFields,
  listTeacherSystemFormFieldKeys,
} from '../teacherFormCustomFields.js';
import { findTeacherSeedField } from '../moduleFieldSetupPersons.js';
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

describe('listEnabledCustomTeacherFormFields', () => {
  it('scopes non-seed fields to the requested tab', () => {
    const fields = {
      basic: [field({ key: 'specialization', order: 0 }), field({ key: 'house', order: 10 })],
      employment: [field({ key: 'extraNote', order: 0 })],
    };

    expect(listEnabledCustomTeacherFormFields(fields, 'basic').map((f) => f.key)).toEqual(['house']);
    expect(listEnabledCustomTeacherFormFields(fields, 'employment').map((f) => f.key)).toEqual([
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

    expect(listEnabledCustomTeacherFormFields(fields, 'employment').map((f) => f.key)).toEqual([
      'visibleCustom',
    ]);
    expect(listTeacherSystemFormFieldKeys().has('status')).toBe(true);
    expect(listTeacherSystemFormFieldKeys().has('contactId')).toBe(true);
    expect(isTeacherSystemFormField('basic', 'specialization')).toBe(true);
    expect(isTeacherSystemFormField('employment', 'joinDate')).toBe(true);
  });

  it('aggregates all tabs when tabId is omitted', () => {
    const fields = {
      basic: [field({ key: 'onBasic', order: 2 })],
      employment: [field({ key: 'onEmployment', order: 1 })],
    };

    expect(listEnabledCustomTeacherFormFields(fields).map((f) => f.key)).toEqual([
      'onEmployment',
      'onBasic',
    ]);
  });
});

describe('findTeacherSeedField', () => {
  it('finds a seeded teacher field across any tab', () => {
    expect(findTeacherSeedField('contactId')?.key).toBe('contactId');
    expect(findTeacherSeedField('employeeId')?.key).toBe('employeeId');
    expect(findTeacherSeedField('status')?.labelKey).toBe('teachers.field.status');
  });

  it('returns undefined for unknown fields', () => {
    expect(findTeacherSeedField('house')).toBeUndefined();
  });
});
