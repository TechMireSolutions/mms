import { describe, expect, it } from 'vitest';
import {
  isContactCustomCollectionTab,
  isContactLockedEnabledTab,
  isContactSeedFormTab,
  resolveContactEnabledTabIds,
  withContactLockedEnabledTabs,
} from './contactEnabledTabs.js';
import { DEFAULT_ENABLED_TABS } from './contactPreferenceDefaults.js';
import {
  CONTACT_LEGACY_CUSTOM_FORM_TAB,
  omitContactLegacyCustomFormTabUnlessUsed,
} from './contactTabRegistry.js';

describe('contactEnabledTabs', () => {
  it('recognizes locked tabs case-insensitively', () => {
    expect(isContactLockedEnabledTab('basic')).toBe(true);
    expect(isContactLockedEnabledTab('Basic')).toBe(true);
    expect(isContactLockedEnabledTab('custom')).toBe(false);
    expect(isContactLockedEnabledTab('phones')).toBe(false);
  });

  it('recognizes seeded form tabs including retired custom', () => {
    expect(isContactSeedFormTab('basic')).toBe(true);
    expect(isContactSeedFormTab('Phones')).toBe(true);
    expect(isContactSeedFormTab('custom')).toBe(true);
    expect(isContactSeedFormTab('custom_abc123')).toBe(false);
  });

  it('treats tenant custom tabs as collection tabs', () => {
    expect(isContactCustomCollectionTab('custom_abc123')).toBe(true);
    expect(isContactCustomCollectionTab('custom')).toBe(false);
    expect(isContactCustomCollectionTab('phones')).toBe(false);
  });

  it('always injects basic into enabled lists', () => {
    expect(withContactLockedEnabledTabs(['phones']).sort()).toEqual(
      ['basic', 'phones'].sort(),
    );
  });

  it('respects formTabs.enabled without unioning all DEFAULT_ENABLED_TABS', () => {
    const enabled = resolveContactEnabledTabIds(
      {
        formTabs: [
          { key: 'basic', label: 'Basic', enabled: true, order: 0 },
          { key: 'phones', label: 'Phones', enabled: false, order: 1 },
          { key: 'emails', label: 'Emails', enabled: true, order: 2 },
          { key: 'custom', label: 'Custom', enabled: false, order: 3 },
        ],
        enabledTabs: [],
      },
      'admin',
    );

    expect(enabled.has('emails')).toBe(true);
    expect(enabled.has('phones')).toBe(false);
    expect(enabled.has('basic')).toBe(true);
    expect(enabled.has('custom')).toBe(false);
    for (const tab of DEFAULT_ENABLED_TABS) {
      if (tab === 'emails') continue;
      expect(enabled.has(tab)).toBe(false);
    }
  });

  it('falls back to DEFAULT_ENABLED_TABS when formTabs are absent', () => {
    const enabled = resolveContactEnabledTabIds({ enabledTabs: [] }, 'admin');
    for (const tab of DEFAULT_ENABLED_TABS) {
      expect(enabled.has(tab)).toBe(true);
    }
    expect(enabled.has('basic')).toBe(true);
    expect(enabled.has('custom')).toBe(false);
  });
});

describe('omitContactLegacyCustomFormTabUnlessUsed', () => {
  it('drops empty retired custom tab', () => {
    const tabs = [
      { key: 'basic', label: 'Identity', enabled: true, order: 0 },
      { ...CONTACT_LEGACY_CUSTOM_FORM_TAB },
    ];
    expect(omitContactLegacyCustomFormTabUnlessUsed(tabs, {}).map((t) => t.key)).toEqual([
      'basic',
    ]);
    expect(
      omitContactLegacyCustomFormTabUnlessUsed(tabs, { custom: [] }).map((t) => t.key),
    ).toEqual(['basic']);
  });

  it('keeps custom when fields remain and normalizes label', () => {
    const tabs = [
      { key: 'basic', label: 'Identity', enabled: true, order: 0 },
      {
        key: 'custom',
        label: 'Custom fields',
        enabled: true,
        order: 6,
        isSystem: true,
      },
    ];
    const next = omitContactLegacyCustomFormTabUnlessUsed(tabs, {
      custom: [{ key: 'extra', label: 'Extra', type: 'text', enabled: true, order: 0 }],
    });
    expect(next.map((t) => t.key)).toEqual(['basic', 'custom']);
    expect(next[1]?.label).toBe('Custom');
    expect(next[1]?.labelKey).toBe('contacts.form.tabCustom');
  });
});
