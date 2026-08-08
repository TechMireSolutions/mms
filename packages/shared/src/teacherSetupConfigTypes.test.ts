import { describe, expect, it } from 'vitest';
import {
  normalizeTeacherModulePreferences,
  normalizeTeachersSettings,
  TEACHER_MODULE_PREFERENCE_KEYS,
} from './teacherSetupConfigTypes.js';
import { DEFAULT_TEACHERS_SETTINGS } from './teachersModuleSettings.js';
import { DEFAULT_TEACHER_SPECIALIZATION } from './teacherTypes.js';

describe('teacherSetupConfigTypes prefs SSOT', () => {
  it('omits defaultViewLayout from preference keys and normalize output', () => {
    expect(TEACHER_MODULE_PREFERENCE_KEYS).not.toContain('defaultViewLayout');
    const prefs = normalizeTeacherModulePreferences({
      idPrefix: 'FAC',
      defaultViewLayout: 'cards',
    } as never);
    expect(prefs).toEqual({
      idPrefix: 'FAC',
      autoGenerateId: DEFAULT_TEACHERS_SETTINGS.autoGenerateId,
      requireContactLink: DEFAULT_TEACHERS_SETTINGS.requireContactLink,
      defaultSpecialization: DEFAULT_TEACHERS_SETTINGS.defaultSpecialization,
    });
    expect('defaultViewLayout' in prefs).toBe(false);
  });

  it('strips legacy defaultViewLayout from normalizeTeachersSettings', () => {
    const settings = normalizeTeachersSettings({
      idPrefix: 'TCH',
      defaultViewLayout: 'cards',
      defaultSpecialization: DEFAULT_TEACHER_SPECIALIZATION,
    });
    expect(
      (settings as typeof settings & { defaultViewLayout?: unknown }).defaultViewLayout,
    ).toBeUndefined();
    expect(settings.defaultSpecialization).toBe(DEFAULT_TEACHER_SPECIALIZATION);
  });
});
