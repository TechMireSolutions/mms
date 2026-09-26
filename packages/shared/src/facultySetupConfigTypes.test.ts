import { describe, expect, it } from 'vitest';
import {
  normalizeTeacherModulePreferences,
  normalizeTeachersSettings,
  TEACHER_MODULE_PREFERENCE_KEYS,
} from './facultySetupConfigTypes.js';
import { DEFAULT_TEACHERS_SETTINGS } from './facultyModuleSettings.js';
import { DEFAULT_TEACHER_SPECIALIZATION } from './facultyTypes.js';

describe('teacherSetupConfigTypes prefs SSOT', () => {
  it('omits defaultViewLayout from preference keys and normalize output', () => {
    expect(TEACHER_MODULE_PREFERENCE_KEYS).not.toContain('defaultViewLayout');
    const prefs = normalizeTeacherModulePreferences({
      idPrefix: 'FAC',
      defaultViewLayout: 'cards',
    } as never);
    expect(prefs).toEqual({
      idPrefix: 'FAC',
      // Employee-ID preferences joined the SSOT after this test was written.
      idTemplate: DEFAULT_TEACHERS_SETTINGS.idTemplate,
      idDigits: DEFAULT_TEACHERS_SETTINGS.idDigits,
      idStartSeq: DEFAULT_TEACHERS_SETTINGS.idStartSeq,
      idRestartAnnually: DEFAULT_TEACHERS_SETTINGS.idRestartAnnually,
      autoGenerateId: DEFAULT_TEACHERS_SETTINGS.autoGenerateId,
      requireContactLink: DEFAULT_TEACHERS_SETTINGS.requireContactLink,
      defaultSpecialization: DEFAULT_TEACHERS_SETTINGS.defaultSpecialization,
      employeeIdPrefix: DEFAULT_TEACHERS_SETTINGS.employeeIdPrefix,
      employeeIdYearFormat: DEFAULT_TEACHERS_SETTINGS.employeeIdYearFormat,
      employeeIdSequenceDigits: DEFAULT_TEACHERS_SETTINGS.employeeIdSequenceDigits,
      employeeIdDelimiter: DEFAULT_TEACHERS_SETTINGS.employeeIdDelimiter,
      employeeIdLastYear: DEFAULT_TEACHERS_SETTINGS.employeeIdLastYear,
      employeeIdCurrentSequence: DEFAULT_TEACHERS_SETTINGS.employeeIdCurrentSequence,
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

  it('strips legacy customFields[] from normalizeTeachersSettings', () => {
    const settings = normalizeTeachersSettings({
      idPrefix: 'TCH',
      customFields: [{ id: 'house', label: 'House' }],
    });
    expect('customFields' in settings).toBe(false);
    expect(typeof settings.fields).toBe('object');
    expect(Array.isArray(settings.fields?.basic)).toBe(true);
  });
});
