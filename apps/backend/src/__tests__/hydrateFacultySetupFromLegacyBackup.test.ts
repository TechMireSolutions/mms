import { describe, expect, it } from 'vitest';
import {
  hydrateFacultySetupCollectionsFromLegacyObjects,
  FACULTY_SETTINGS_OBJECT_KEY,
  FACULTY_COLUMN_PREFS_OBJECT_KEY,
  FACULTY_FALLBACK_SETTINGS_OBJECT_KEY,
  FACULTY_FALLBACK_COLUMN_PREFS_OBJECT_KEY,
  FACULTY_FALLBACK_CONFIG_OBJECT_KEY,
  FACULTY_LEGACY_SETUP_OBJECT_KEYS,
  LEGACY_FACULTY_COLLECTION_ALIASES,
} from '../db/hydrateFacultySetupFromLegacyBackup.js';

describe('Faculty Setup Legacy Constants Contract', () => {
  it('exports canonical and fallback object keys', () => {
    expect(FACULTY_SETTINGS_OBJECT_KEY).toBe('faculty_settings');
    expect(FACULTY_COLUMN_PREFS_OBJECT_KEY).toBe('faculty_user_column_preferences');
    expect(FACULTY_FALLBACK_SETTINGS_OBJECT_KEY).toBe('teachers_settings');
    expect(FACULTY_FALLBACK_COLUMN_PREFS_OBJECT_KEY).toBe('teacher_user_column_preferences');
    expect(FACULTY_FALLBACK_CONFIG_OBJECT_KEY).toBe('teacher_field_config');
  });

  it('exports complete list of legacy setup object keys to exclude from document store', () => {
    expect(FACULTY_LEGACY_SETUP_OBJECT_KEYS).toContain('faculty_settings');
    expect(FACULTY_LEGACY_SETUP_OBJECT_KEYS).toContain('faculty_user_column_preferences');
    expect(FACULTY_LEGACY_SETUP_OBJECT_KEYS).toContain('teachers_settings');
    expect(FACULTY_LEGACY_SETUP_OBJECT_KEYS).toContain('teacher_user_column_preferences');
    expect(FACULTY_LEGACY_SETUP_OBJECT_KEYS).toContain('teacher_field_config');
    expect(FACULTY_LEGACY_SETUP_OBJECT_KEYS).toContain('faculty_field_config');
  });

  it('covers all 5 legacy collection aliases mapped to canonical faculty collections', () => {
    const aliases = new Map(LEGACY_FACULTY_COLLECTION_ALIASES);
    expect(aliases.get('teachers')).toBe('faculty');
    expect(aliases.get('teacher_field_configs')).toBe('faculty_field_configs');
    expect(aliases.get('teacher_module_preferences')).toBe('faculty_module_preferences');
    expect(aliases.get('teacher_user_column_prefs')).toBe('faculty_user_column_prefs');
    expect(aliases.get('teacher_lookups')).toBe('faculty_lookups');
  });
});

describe('hydrateFacultySetupCollectionsFromLegacyObjects', () => {
  it('no-ops without users (partial payload)', () => {
    const collections = { faculty: [{ id: 'f-1' }] };
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(collections, {
      [FACULTY_SETTINGS_OBJECT_KEY]: { fields: {}, autoGenerateId: true },
      [FACULTY_FALLBACK_SETTINGS_OBJECT_KEY]: { fields: {}, autoGenerateId: true },
    });
    expect(next).toEqual(collections);
  });

  it('no-ops when objects store is undefined', () => {
    const collections = { users: [{ id: 'u-1' }], faculty: [{ id: 'f-1' }] };
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(collections, undefined);
    expect(next).toEqual(collections);
  });

  it('hydrates field-config and preferences from fallback teachers_settings when typed collections empty', () => {
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(
      { users: [{ id: 'u-1' }] },
      {
        [FACULTY_FALLBACK_SETTINGS_OBJECT_KEY]: {
          fields: {
            basic: [{ key: 'specialization', label: 'Spec', type: 'select', enabled: true, order: 0 }],
          },
          autoGenerateId: false,
          idPrefix: 'TCH',
          requireContactLink: true,
          defaultSpecialization: 'Hifz',
        },
      },
    );
    expect(next.faculty_field_configs).toHaveLength(1);
    expect(next.faculty_module_preferences).toHaveLength(1);
    expect(next.teacher_field_configs).toBeUndefined();
    expect(next.teacher_module_preferences).toBeUndefined();
    const prefsRow = next.faculty_module_preferences?.[0] as {
      preferences: Record<string, unknown>;
    };
    expect(prefsRow.preferences.idPrefix).toBe('TCH');
    expect(prefsRow.preferences.autoGenerateId).toBe(false);
    expect(prefsRow.preferences.defaultSpecialization).toBe('Hifz');
  });

  it('hydrates field-config and preferences from modern faculty_settings', () => {
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(
      { users: [{ id: 'u-1' }] },
      {
        [FACULTY_SETTINGS_OBJECT_KEY]: {
          fields: {
            basic: [{ key: 'specialization', label: 'Spec', type: 'select', enabled: true, order: 0 }],
          },
          autoGenerateId: true,
          employeeIdPrefix: 'FAC',
          requireContactLink: true,
          defaultSpecialization: 'Islamic Studies',
        },
      },
    );
    expect(next.faculty_field_configs).toHaveLength(1);
    expect(next.faculty_module_preferences).toHaveLength(1);
    const fieldRow = next.faculty_field_configs?.[0] as {
      config: { fields?: Record<string, unknown> };
    };
    expect(fieldRow.config.fields).toBeDefined();
    const prefsRow = next.faculty_module_preferences?.[0] as {
      preferences: Record<string, unknown>;
    };
    expect(prefsRow.preferences.employeeIdPrefix).toBe('FAC');
    expect(prefsRow.preferences.autoGenerateId).toBe(true);
  });

  it('prioritizes modern faculty_settings over fallback teachers_settings when both present', () => {
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(
      { users: [{ id: 'u-1' }] },
      {
        [FACULTY_SETTINGS_OBJECT_KEY]: { employeeIdPrefix: 'FAC-MODERN' },
        [FACULTY_FALLBACK_SETTINGS_OBJECT_KEY]: { employeeIdPrefix: 'TCH-LEGACY' },
      },
    );
    const prefsRow = next.faculty_module_preferences?.[0] as {
      preferences: Record<string, unknown>;
    };
    expect(prefsRow.preferences.employeeIdPrefix).toBe('FAC-MODERN');
  });

  it('does not overwrite non-empty typed Setup collections', () => {
    const existing = [{ config: { version: 1 } }];
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(
      {
        users: [{ id: 'u-1' }],
        faculty_field_configs: existing,
        faculty_module_preferences: [{ preferences: { autoGenerateId: true } }],
      },
      {
        [FACULTY_SETTINGS_OBJECT_KEY]: { autoGenerateId: false, employeeIdPrefix: 'X' },
      },
    );
    expect(next.faculty_field_configs).toBe(existing);
  });

  it('expands modern faculty_user_column_preferences map into typed rows', () => {
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(
      { users: [{ id: 'u-1' }] },
      {
        [FACULTY_COLUMN_PREFS_OBJECT_KEY]: {
          'u-admin': [{ key: 'name', enabled: true, order: 0 }],
          'u-faculty': [{ key: 'specialization', enabled: false, order: 1 }],
        },
      },
    );
    expect(next.faculty_user_column_prefs).toEqual([
      { userId: 'u-admin', preferences: [{ key: 'name', enabled: true, order: 0 }] },
      { userId: 'u-faculty', preferences: [{ key: 'specialization', enabled: false, order: 1 }] },
    ]);
  });

  it('expands historical fallback column preferences map into typed rows when modern absent', () => {
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(
      { users: [{ id: 'u-1' }] },
      {
        [FACULTY_FALLBACK_COLUMN_PREFS_OBJECT_KEY]: {
          'u-admin': [{ key: 'name', enabled: true, order: 0 }],
          'u-faculty': [{ key: 'specialization', enabled: false, order: 1 }],
        },
      },
    );
    expect(next.faculty_user_column_prefs).toEqual([
      { userId: 'u-admin', preferences: [{ key: 'name', enabled: true, order: 0 }] },
      { userId: 'u-faculty', preferences: [{ key: 'specialization', enabled: false, order: 1 }] },
    ]);
  });

  it('prioritizes modern faculty_user_column_preferences over fallback when both present', () => {
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(
      { users: [{ id: 'u-1' }] },
      {
        [FACULTY_COLUMN_PREFS_OBJECT_KEY]: {
          'u-1': [{ key: 'modernKey', enabled: true, order: 0 }],
        },
        [FACULTY_FALLBACK_COLUMN_PREFS_OBJECT_KEY]: {
          'u-1': [{ key: 'legacyKey', enabled: true, order: 0 }],
        },
      },
    );
    expect(next.faculty_user_column_prefs).toEqual([
      { userId: 'u-1', preferences: [{ key: 'modernKey', enabled: true, order: 0 }] },
    ]);
  });

  it('forward-migrates all legacy collection aliases into canonical faculty collections', () => {
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(
      {
        users: [{ id: 'u-1' }],
        teachers: [{ id: 'f-legacy-1', name: 'Ustadh' }],
        teacher_field_configs: [{ config: { version: 1 } }],
        teacher_module_preferences: [{ preferences: { autoGenerateId: true } }],
        teacher_user_column_prefs: [{ userId: 'u-1', preferences: [] }],
        teacher_lookups: [{ key: 'designation', label: 'Senior Ustadh' }],
      },
      {},
    );
    expect(next.faculty).toEqual([{ id: 'f-legacy-1', name: 'Ustadh' }]);
    expect(next.faculty_field_configs).toEqual([{ config: { version: 1 } }]);
    expect(next.faculty_module_preferences).toEqual([{ preferences: { autoGenerateId: true } }]);
    expect(next.faculty_user_column_prefs).toEqual([{ userId: 'u-1', preferences: [] }]);
    expect(next.faculty_lookups).toEqual([{ key: 'designation', label: 'Senior Ustadh' }]);
    expect(next.teachers).toBeUndefined();
    expect(next.teacher_field_configs).toBeUndefined();
    expect(next.teacher_module_preferences).toBeUndefined();
    expect(next.teacher_user_column_prefs).toBeUndefined();
    expect(next.teacher_lookups).toBeUndefined();
  });

  it('does not overwrite canonical faculty collections when legacy aliases are also present', () => {
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(
      {
        users: [{ id: 'u-1' }],
        faculty: [{ id: 'f-canonical', name: 'Dr. Ahmad' }],
        teachers: [{ id: 'f-stale', name: 'Stale Faculty Member' }],
        faculty_field_configs: [{ config: { version: 2 } }],
        teacher_field_configs: [{ config: { version: 1 } }],
        faculty_lookups: [{ key: 'dept', label: 'Faculty Dept' }],
        teacher_lookups: [{ key: 'dept', label: 'Legacy Dept' }],
      },
      {},
    );
    expect(next.faculty).toEqual([{ id: 'f-canonical', name: 'Dr. Ahmad' }]);
    expect(next.faculty_field_configs).toEqual([{ config: { version: 2 } }]);
    expect(next.faculty_lookups).toEqual([{ key: 'dept', label: 'Faculty Dept' }]);
    expect(next.teachers).toBeUndefined();
    expect(next.teacher_field_configs).toBeUndefined();
    expect(next.teacher_lookups).toBeUndefined();
  });
});

