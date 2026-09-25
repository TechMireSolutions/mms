import { describe, expect, it } from 'vitest';
import { hydrateFacultySetupCollectionsFromLegacyObjects } from '../db/hydrateFacultySetupFromLegacyBackup.js';

describe('hydrateFacultySetupCollectionsFromLegacyObjects', () => {
  it('no-ops without users (partial payload)', () => {
    const collections = { teachers: [{ id: 't-1' }] };
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(collections, {
      teachers_settings: { fields: {}, autoGenerateId: true },
    });
    expect(next).toEqual(collections);
  });

  it('hydrates field-config and preferences from teachers_settings when typed collections empty', () => {
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(
      { users: [{ id: 'u-1' }] },
      {
        teachers_settings: {
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
    expect(next.teacher_field_configs).toHaveLength(1);
    expect(next.teacher_module_preferences).toHaveLength(1);
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
        faculty_settings: {
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
    const prefsRow = next.faculty_module_preferences?.[0] as {
      preferences: Record<string, unknown>;
    };
    expect(prefsRow.preferences.employeeIdPrefix).toBe('FAC');
    expect(prefsRow.preferences.autoGenerateId).toBe(true);
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
        faculty_settings: { autoGenerateId: false, employeeIdPrefix: 'X' },
      },
    );
    expect(next.faculty_field_configs).toBe(existing);
  });

  it('expands teacher_user_column_preferences map into typed rows', () => {
    const next = hydrateFacultySetupCollectionsFromLegacyObjects(
      { users: [{ id: 'u-1' }] },
      {
        teacher_user_column_preferences: {
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
});
