import { describe, expect, it } from 'vitest';
import {
  TEACHER_WRITE_SYSTEM_KEYS,
  buildDynamicTeacherSchema,
  formatTeacherZodIssues,
} from '../teacherValidation.js';
import { listTeacherSystemFormFieldKeys } from '../teacherFormCustomFields.js';
import { DEFAULT_TEACHERS_SETTINGS, type TeachersSettings } from '../teachersModuleSettings.js';
import { INITIAL_TEACHERS_FIELD_SEED } from '../moduleFieldSetupPersons.js';
import type { FieldDefinition } from '../contactTypes.js';

describe('buildDynamicTeacherSchema', () => {
  const settings: TeachersSettings = {
    ...DEFAULT_TEACHERS_SETTINGS,
    requireContactLink: true,
  };
  const enabledTabs = new Set(['basic', 'employment']);
  const fields: Record<string, FieldDefinition[]> = {
    basic: INITIAL_TEACHERS_FIELD_SEED.basic.map((field) => ({ ...field })),
    employment: INITIAL_TEACHERS_FIELD_SEED.employment.map((field) => ({ ...field })),
  };

  it('accepts a valid teacher write payload', () => {
    const schema = buildDynamicTeacherSchema(settings, enabledTabs, fields);
    const result = schema.safeParse({
      contactId: 'c-1',
      specialization: 'Hifz',
      status: 'active',
      employeeId: 'TCH-1',
      joinDate: '2024-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('requires contactId when requireContactLink is true', () => {
    const schema = buildDynamicTeacherSchema(settings, enabledTabs, fields);
    const result = schema.safeParse({
      contactId: '',
      specialization: 'Hifz',
      status: 'active',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatTeacherZodIssues(result.error, {}, fields);
      expect(formatted.some((err) => err.fieldId === 'contactId')).toBe(true);
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
    const schema = buildDynamicTeacherSchema(settings, enabledTabs, withCustom);
    const result = schema.safeParse({
      contactId: 'c-1',
      specialization: 'Hifz',
      status: 'active',
      joinDate: '2024-01-15',
      employeeId: 'TCH-1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatTeacherZodIssues(result.error, {}, withCustom);
      expect(formatted.some((err) => err.fieldId === 'badgeColor' && err.tabId === 'employment')).toBe(
        true,
      );
    }
  });

  it('rejects unknown keys via .strict()', () => {
    const schema = buildDynamicTeacherSchema(settings, enabledTabs, fields);
    const result = schema.safeParse({
      contactId: 'c-1',
      specialization: 'Hifz',
      status: 'active',
      notARealField: 'x',
    });
    expect(result.success).toBe(false);
  });

  it('strips contact profile dual-write keys before validation', () => {
    const schema = buildDynamicTeacherSchema(settings, enabledTabs, fields);
    const result = schema.safeParse({
      contactId: 'c-1',
      specialization: 'Hifz',
      status: 'active',
      joinDate: '2024-01-15',
      employeeId: 'TCH-1',
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

describe('TEACHER_WRITE_SYSTEM_KEYS', () => {
  it('includes every seed system field key plus audit meta keys', () => {
    for (const key of listTeacherSystemFormFieldKeys()) {
      expect(TEACHER_WRITE_SYSTEM_KEYS).toContain(key);
    }
    for (const key of ['id', 'userId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']) {
      expect(TEACHER_WRITE_SYSTEM_KEYS).toContain(key);
    }
  });
});
