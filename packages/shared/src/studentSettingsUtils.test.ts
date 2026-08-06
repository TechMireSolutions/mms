import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STUDENTS_SETTINGS,
  type FieldDefinition,
  normalizeStudentsSettings,
} from './index.js';

describe('normalizeStudentsSettings', () => {
  it('migrates legacy flat student fields into Identity + Registration (v4)', () => {
    const settings = normalizeStudentsSettings({
      ...DEFAULT_STUDENTS_SETTINGS,
      fields: {
        gender: { enabled: true, required: false },
        dob: { enabled: true, required: true },
        fatherLink: { enabled: false, required: false },
      },
    });

    expect(settings.version).toBe(4);
    expect(settings.enabledTabs).toEqual(['registration']);
    expect(Array.isArray(settings.fields?.basic)).toBe(true);
    expect(Array.isArray(settings.fields?.registration)).toBe(true);
    expect(settings.fields?.guardian).toBeUndefined();
    expect(settings.fields?.academic).toBeUndefined();
    const fields = settings.fields as Record<string, FieldDefinition[]>;
    expect(fields.basic.find((field) => field.key === 'gender')?.required).toBe(false);
    expect(fields.basic.find((field) => field.key === 'fatherLink')).toBeUndefined();
    expect(fields.basic.find((field) => field.key === 'contactRelationships')?.enabled).toBe(false);
  });

  it('preserves modern tabbed fields even when a stored version is missing', () => {
    const settings = normalizeStudentsSettings({
      ...DEFAULT_STUDENTS_SETTINGS,
      version: undefined,
      fields: {
        basic: [
          {
            key: 'studentCode',
            label: 'Student code',
            type: 'text',
            enabled: true,
            required: true,
            order: 0,
          },
        ],
      },
    });

    const fields = settings.fields as Record<string, FieldDefinition[]>;
    expect(settings.version).toBe(4);
    expect(fields.basic.map((field) => field.key)).toContain('studentCode');
    expect(fields.basic.find((field) => field.key === 'studentCode')?.required).toBe(true);
    expect(fields.basic.find((field) => field.key === 'contactRelationships')).toBeDefined();
  });

  it('merges guardian into basic and replaces triad with contactRelationships at v4', () => {
    const settings = normalizeStudentsSettings({
      ...DEFAULT_STUDENTS_SETTINGS,
      version: 2,
      enabledTabs: ['guardian', 'academic'],
      formTabs: [
        { key: 'basic', label: 'Identity', enabled: true, order: 0, isSystem: true },
        { key: 'guardian', label: 'Guardians', enabled: true, order: 1, isSystem: true },
        { key: 'academic', label: 'Enrollment', enabled: true, order: 2, isSystem: true },
      ],
      fields: {
        basic: [
          {
            key: 'gender',
            label: 'Gender',
            type: 'select',
            enabled: true,
            required: true,
            order: 0,
          },
          {
            key: 'house',
            label: 'House',
            type: 'text',
            enabled: true,
            required: false,
            order: 10,
          },
        ],
        guardian: [
          {
            key: 'fatherLink',
            label: 'Father',
            type: 'text',
            enabled: true,
            required: false,
            order: 0,
          },
          {
            key: 'emergencyNote',
            label: 'Emergency note',
            type: 'text',
            enabled: true,
            required: false,
            order: 1,
          },
        ],
        academic: [
          {
            key: 'registeredDate',
            label: 'Registration Date',
            type: 'date',
            enabled: true,
            required: true,
            order: 0,
          },
          {
            key: 'scholarshipNote',
            label: 'Scholarship',
            type: 'text',
            enabled: true,
            required: false,
            order: 1,
          },
        ],
      },
    });

    expect(settings.version).toBe(4);
    expect(settings.enabledTabs).toEqual(['registration']);
    expect(settings.fields?.guardian).toBeUndefined();
    expect(settings.fields?.academic).toBeUndefined();

    const fields = settings.fields as Record<string, FieldDefinition[]>;
    expect(fields.basic.map((field) => field.key)).toEqual([
      'gender',
      'house',
      'emergencyNote',
      'contactRelationships',
    ]);
    expect(fields.basic.find((field) => field.key === 'contactRelationships')?.enabled).toBe(true);
    expect(fields.registration.map((field) => field.key)).toEqual([
      'registeredDate',
      'scholarshipNote',
    ]);
    expect(settings.formTabs?.map((tab) => tab.key)).toEqual(['basic', 'registration']);
  });
});
