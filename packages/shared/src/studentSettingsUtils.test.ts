import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STUDENTS_SETTINGS,
  type FieldDefinition,
  normalizeStudentsSettings,
} from './index.js';

describe('normalizeStudentsSettings', () => {
  it('migrates legacy flat student fields into tabbed field settings', () => {
    const settings = normalizeStudentsSettings({
      ...DEFAULT_STUDENTS_SETTINGS,
      fields: {
        gender: { enabled: true, required: false },
        dob: { enabled: true, required: true },
        fatherLink: { enabled: false, required: false },
      },
    });

    expect(settings.version).toBe(2);
    expect(settings.enabledTabs).toEqual(['guardian', 'academic']);
    expect(Array.isArray(settings.fields?.basic)).toBe(true);
    expect(Array.isArray(settings.fields?.guardian)).toBe(true);
    const fields = settings.fields as Record<string, FieldDefinition[]>;
    expect(fields.basic.find((field) => field.key === 'gender')?.required).toBe(false);
    expect(fields.guardian.find((field) => field.key === 'fatherLink')?.enabled).toBe(false);
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
    expect(settings.version).toBe(2);
    expect(fields.basic).toEqual([
      expect.objectContaining({
        key: 'studentCode',
        required: true,
      }),
    ]);
  });
});
