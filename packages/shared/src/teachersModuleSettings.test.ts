import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEACHER_FIELD_DEFS,
  DEFAULT_TEACHERS_SETTINGS,
  getSortedTeacherFields,
} from './teachersModuleSettings.js';
import { INITIAL_TEACHERS_FIELD_SEED } from './moduleFieldSetupPersons.js';
import { normalizeTeachersSettings } from './teacherSetupConfigTypes.js';

describe('DEFAULT_TEACHERS_SETTINGS.fields', () => {
  it('defaults to a tabbed FieldDefinition[] map from the seed', () => {
    const fields = DEFAULT_TEACHERS_SETTINGS.fields as Record<string, unknown>;
    expect(Array.isArray(fields.basic)).toBe(true);
    expect(Array.isArray(fields.employment)).toBe(true);
    expect((fields.basic as { key: string }[]).some((field) => field.key === 'contactId')).toBe(
      true,
    );
  });
});

describe('getSortedTeacherFields', () => {
  it('reads enabled flags from a tabbed fields map', () => {
    const tabbed = {
      basic: INITIAL_TEACHERS_FIELD_SEED.basic.map((field) =>
        field.key === 'specialization' ? { ...field, enabled: false } : { ...field },
      ),
      employment: INITIAL_TEACHERS_FIELD_SEED.employment.map((field) => ({ ...field })),
    };
    const sorted = getSortedTeacherFields(undefined, tabbed);
    expect(sorted.find((field) => field.id === 'specialization')?.enabled).toBe(false);
    expect(sorted.find((field) => field.id === 'status')?.enabled).toBe(true);
  });

  it('reads customs from the tabbed map (legacy customFields[] is retired)', () => {
    const withTabbedCustoms = {
      ...INITIAL_TEACHERS_FIELD_SEED,
      employment: [
        ...INITIAL_TEACHERS_FIELD_SEED.employment,
        {
          key: 'badgeColor',
          label: 'Badge',
          type: 'text' as const,
          enabled: true,
          order: 99,
          required: false,
        },
      ],
    };
    const sorted = getSortedTeacherFields(undefined, withTabbedCustoms);
    expect(sorted.some((field) => field.id === 'badgeColor' && field.isCustom)).toBe(true);

    const seedOnly = getSortedTeacherFields(undefined, INITIAL_TEACHERS_FIELD_SEED);
    expect(seedOnly.some((field) => field.id === 'badgeColor')).toBe(false);
  });

  it('keeps DEFAULT_TEACHER_FIELD_DEFS aligned with seed system keys', () => {
    const seedKeys = Object.values(INITIAL_TEACHERS_FIELD_SEED).flat().map((field) => field.key);
    expect(DEFAULT_TEACHER_FIELD_DEFS.map((field) => field.id)).toEqual(seedKeys);
  });
});

describe('normalizeTeachersSettings', () => {
  it('falls back to default seed fields when raw.fields is an empty object', () => {
    const normalized = normalizeTeachersSettings({ fields: {} });
    expect(typeof normalized.fields).toBe('object');
    expect(Object.keys(normalized.fields as Record<string, unknown>).length).toBeGreaterThan(0);
    expect(Array.isArray((normalized.fields as any).basic)).toBe(true);
    expect((normalized.fields as any).basic.length).toBeGreaterThan(0);
  });
});

