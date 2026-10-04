import { describe, expect, it } from 'vitest';
import {
  FACULTY_WRITE_SYSTEM_KEYS,
  buildDynamicFacultySchema,
  formatFacultyZodIssues,
} from '../facultyValidation.js';
import { listFacultySystemFormFieldKeys } from '../facultyFormCustomFields.js';
import { DEFAULT_FACULTY_SETTINGS, type FacultySettings } from '../facultyModuleSettings.js';
import { INITIAL_FACULTY_FIELD_SEED } from '../moduleFieldSetupFaculty.js';
import type { FieldDefinition } from '../contactTypes.js';

describe('buildDynamicFacultySchema', () => {
  const settings: FacultySettings = {
    ...DEFAULT_FACULTY_SETTINGS,
    requireContactLink: true,
  };
  const enabledTabs = new Set(['basic', 'employment']);
  const fields: Record<string, FieldDefinition[]> = {
    basic: INITIAL_FACULTY_FIELD_SEED.basic.map((field) => ({ ...field })),
    employment: INITIAL_FACULTY_FIELD_SEED.employment.map((field) => ({ ...field })),
  };

  it('accepts a valid faculty write payload', () => {
    const schema = buildDynamicFacultySchema(settings, enabledTabs, fields);
    const result = schema.safeParse({
      contactId: 'c-1',
      specialization: 'Hifz',
      status: 'active',
      employeeId: 'FAC-1',
      joinDate: '2024-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('requires contactId (contact link is compulsory)', () => {
    const schema = buildDynamicFacultySchema(settings, enabledTabs, fields);
    const result = schema.safeParse({
      contactId: '',
      specialization: 'Hifz',
      status: 'active',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatFacultyZodIssues(result.error, {}, fields);
      expect(formatted.some((err) => err.fieldId === 'contactId')).toBe(true);
    }
  });

  it('requires contactId even when Setup disables the contact field', () => {
    const disabledContact: Record<string, FieldDefinition[]> = {
      basic: fields.basic.map((field) =>
        field.key === 'contactId' ? { ...field, enabled: false, required: false } : field,
      ),
      employment: fields.employment,
    };
    const schema = buildDynamicFacultySchema(settings, enabledTabs, disabledContact);
    const result = schema.safeParse({
      status: 'active',
      employeeId: 'FAC-1',
      joinDate: '2024-01-15',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatFacultyZodIssues(result.error, {}, disabledContact);
      expect(formatted.some((err) => err.fieldId === 'contactId')).toBe(true);
    }
  });

  it('requires designationStartsOn when designationId is set', () => {
    const schema = buildDynamicFacultySchema(settings, enabledTabs, fields);
    const result = schema.safeParse({
      contactId: 'c-1',
      status: 'active',
      employeeId: 'FAC-1',
      joinDate: '2024-01-15',
      designationId: 'des-1',
      designationStartsOn: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'designationStartsOn')).toBe(true);
    }
  });

  it('requires enabled custom fields and maps tab id', () => {
    const withCustom: Record<string, FieldDefinition[]> = {
      ...fields,
      employment: [
        ...fields.employment,
        {
          key: 'badgeColor',
          label: 'Badge',
          type: 'text',
          enabled: true,
          required: true,
          order: 99,
        },
      ],
    };
    const schema = buildDynamicFacultySchema(settings, enabledTabs, withCustom);
    const result = schema.safeParse({
      contactId: 'c-1',
      specialization: 'Hifz',
      status: 'active',
      joinDate: '2024-01-15',
      employeeId: 'FAC-1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatFacultyZodIssues(result.error, {}, withCustom);
      expect(formatted.some((err) => err.fieldId === 'badgeColor' && err.tabId === 'employment')).toBe(
        true,
      );
    }
  });

  it('rejects unknown keys via .strict()', () => {
    const schema = buildDynamicFacultySchema(settings, enabledTabs, fields);
    const result = schema.safeParse({
      contactId: 'c-1',
      specialization: 'Hifz',
      status: 'active',
      notARealField: 'x',
    });
    expect(result.success).toBe(false);
  });

  it('strips contact profile dual-write keys before validation', () => {
    const schema = buildDynamicFacultySchema(settings, enabledTabs, fields);
    const result = schema.safeParse({
      contactId: 'c-1',
      specialization: 'Hifz',
      status: 'active',
      joinDate: '2024-01-15',
      employeeId: 'FAC-1',
      name: 'Should Strip',
      phone: '+10000000000',
      email: 'a@b.c',
      gender: 'male',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.name).toBeUndefined();
      expect(data.phone).toBeUndefined();
      expect(data.email).toBeUndefined();
      expect(data.gender).toBeUndefined();
    }
  });
});

describe('FACULTY_WRITE_SYSTEM_KEYS', () => {
  it('includes every seed system field key plus audit meta keys', () => {
    for (const key of listFacultySystemFormFieldKeys()) {
      expect(FACULTY_WRITE_SYSTEM_KEYS).toContain(key);
    }
    for (const key of ['id', 'userId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']) {
      expect(FACULTY_WRITE_SYSTEM_KEYS).toContain(key);
    }
  });
});
