import { describe, expect, it } from 'vitest';
import {
  composeStudentsSettings,
  mergeStudentsFormTabsFromApi,
  normalizeStudentModulePreferences,
  splitStudentsSettingsBlob,
  stripStudentFieldConfigForPersist,
} from './studentSetupConfigTypes.js';
import { STUDENT_TAB_REGISTRY } from './moduleFieldSetupPersons.js';

describe('normalizeStudentModulePreferences', () => {
  it('returns defaults for null/empty', () => {
    expect(normalizeStudentModulePreferences(null)).toEqual({
      autoGenerateId: true,
      grNumberTemplate: '{seq}-{year}',
      grNumberDigits: 4,
      grNumberRestartAnnually: true,
    });
  });

  it('keeps valid overrides', () => {
    expect(
      normalizeStudentModulePreferences({
        autoGenerateId: false,
        grNumberTemplate: 'GR-{seq}',
        grNumberDigits: 6,
        grNumberRestartAnnually: false,
      }),
    ).toEqual({
      autoGenerateId: false,
      grNumberTemplate: 'GR-{seq}',
      grNumberDigits: 6,
      grNumberRestartAnnually: false,
    });
  });
});

describe('splitStudentsSettingsBlob / stripStudentFieldConfigForPersist', () => {
  it('splits GR prefs from field-config and never persists formTabs', () => {
    const { fieldConfig, preferences } = splitStudentsSettingsBlob({
      autoGenerateId: false,
      grNumberTemplate: 'S-{seq}',
      grNumberDigits: 3,
      grNumberRestartAnnually: false,
      enabledTabs: ['registration'],
      formTabs: [{ key: 'basic', label: 'Basic', enabled: true, order: 0 }],
      fields: { registration: [] },
    });
    expect(preferences).toEqual({
      autoGenerateId: false,
      grNumberTemplate: 'S-{seq}',
      grNumberDigits: 3,
      grNumberRestartAnnually: false,
    });
    expect(fieldConfig.formTabs).toBeUndefined();
    expect(fieldConfig.autoGenerateId).toBeUndefined();
    expect(fieldConfig.grNumberTemplate).toBeUndefined();
    expect(fieldConfig.enabledTabs).toEqual(['registration']);

    const stripped = stripStudentFieldConfigForPersist({
      ...preferences,
      formTabs: STUDENT_TAB_REGISTRY,
      enabledTabs: ['basic'],
    });
    expect(stripped.formTabs).toBeUndefined();
    expect(stripped.autoGenerateId).toBeUndefined();
  });
});

describe('composeStudentsSettings', () => {
  it('merges field-config + preferences into StudentsSettings', () => {
    const settings = composeStudentsSettings(
      { enabledTabs: ['registration'], version: 4 },
      { autoGenerateId: false, grNumberTemplate: 'X-{seq}', grNumberDigits: 2 },
    );
    expect(settings.autoGenerateId).toBe(false);
    expect(settings.grNumberTemplate).toBe('X-{seq}');
    expect(settings.grNumberDigits).toBe(2);
    expect(settings.enabledTabs).toContain('registration');
  });
});

describe('mergeStudentsFormTabsFromApi', () => {
  it('falls back to registry when API empty and document empty', () => {
    expect(mergeStudentsFormTabsFromApi(undefined, []).map((tab) => tab.key)).toEqual(
      STUDENT_TAB_REGISTRY.map((tab) => tab.key),
    );
  });

  it('prefers API tabs and appends missing seed tabs', () => {
    const merged = mergeStudentsFormTabsFromApi(
      STUDENT_TAB_REGISTRY,
      [{ key: 'custom_foo', label: 'Foo', enabled: true, order: 2 }],
    );
    expect(merged.map((tab) => tab.key)).toEqual([
      'custom_foo',
      ...STUDENT_TAB_REGISTRY.map((tab) => tab.key),
    ]);
  });
});
