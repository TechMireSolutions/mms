import { describe, expect, it } from 'vitest';
import { hydrateTeachersSetupCollectionsFromLegacyObjects } from '../db/hydrateTeachersSetupFromLegacyBackup.js';

describe('hydrateTeachersSetupCollectionsFromLegacyObjects', () => {
  it('no-ops without users (partial payload)', () => {
    const collections = { teachers: [{ id: 't-1' }] };
    const next = hydrateTeachersSetupCollectionsFromLegacyObjects(collections, {
      teachers_settings: { fields: {}, autoGenerateId: true },
    });
    expect(next).toEqual(collections);
  });

  it('hydrates field-config and preferences from teachers_settings when typed collections empty', () => {
    const next = hydrateTeachersSetupCollectionsFromLegacyObjects(
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
    expect(next.teacher_field_configs).toHaveLength(1);
    expect(next.teacher_module_preferences).toHaveLength(1);
    const prefsRow = next.teacher_module_preferences?.[0] as {
      preferences: Record<string, unknown>;
    };
    expect(prefsRow.preferences.idPrefix).toBe('TCH');
    expect(prefsRow.preferences.autoGenerateId).toBe(false);
    expect(prefsRow.preferences.defaultSpecialization).toBe('Hifz');
  });

  it('does not overwrite non-empty typed Setup collections', () => {
    const existing = [{ config: { version: 1 } }];
    const next = hydrateTeachersSetupCollectionsFromLegacyObjects(
      {
        users: [{ id: 'u-1' }],
        teacher_field_configs: existing,
        teacher_module_preferences: [{ preferences: { autoGenerateId: true } }],
      },
      {
        teachers_settings: { autoGenerateId: false, idPrefix: 'X' },
      },
    );
    expect(next.teacher_field_configs).toBe(existing);
  });

  it('expands teacher_user_column_preferences map into typed rows', () => {
    const next = hydrateTeachersSetupCollectionsFromLegacyObjects(
      { users: [{ id: 'u-1' }] },
      {
        teacher_user_column_preferences: {
          'u-admin': [{ key: 'name', enabled: true, order: 0 }],
          'u-teacher': [{ key: 'specialization', enabled: false, order: 1 }],
        },
      },
    );
    expect(next.teacher_user_column_prefs).toEqual([
      { userId: 'u-admin', preferences: [{ key: 'name', enabled: true, order: 0 }] },
      { userId: 'u-teacher', preferences: [{ key: 'specialization', enabled: false, order: 1 }] },
    ]);
  });
});
