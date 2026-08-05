import { describe, expect, it } from 'vitest';
import { CONTACT_LEGACY_CUSTOM_FORM_TAB, DEFAULT_FORM_TABS } from './contactTabRegistry.js';
import { mergeContactsFormTabsFromApi } from './contactFormTabsMerge.js';

describe('mergeContactsFormTabsFromApi', () => {
  it('returns document/default tabs when API is empty', () => {
    expect(mergeContactsFormTabsFromApi(undefined, [])).toEqual([...DEFAULT_FORM_TABS]);
    expect(
      mergeContactsFormTabsFromApi([{ key: 'basic', label: 'X', enabled: true, order: 0 }], []),
    ).toEqual([{ key: 'basic', label: 'X', enabled: true, order: 0 }]);
  });

  it('prefers API rows and fills missing seed tabs without empty custom', () => {
    const apiTabs = [
      { key: 'custom_notes', label: 'Notes', enabled: true, order: 0, isSystem: false },
      { key: 'basic', label: 'Identity', enabled: true, order: 1, isSystem: true },
      {
        key: CONTACT_LEGACY_CUSTOM_FORM_TAB.key,
        label: 'Custom fields',
        enabled: true,
        order: 6,
        isSystem: true,
      },
    ];
    const merged = mergeContactsFormTabsFromApi(DEFAULT_FORM_TABS, apiTabs);
    expect(merged.map((tab) => tab.key)).toEqual([
      'custom_notes',
      'basic',
      'phones',
      'emails',
      'addresses',
      'socials',
      'relationship',
    ]);
  });

  it('does not resurrect document-only custom tabs omitted from API', () => {
    const documentTabs = [
      ...DEFAULT_FORM_TABS,
      { key: 'custom_notes', label: 'Notes', enabled: true, order: 10, isSystem: false },
    ];
    const apiTabs = DEFAULT_FORM_TABS.map((tab) => ({ ...tab }));
    const merged = mergeContactsFormTabsFromApi(documentTabs, apiTabs);
    expect(merged.map((tab) => tab.key)).toEqual(DEFAULT_FORM_TABS.map((tab) => tab.key));
    expect(merged.map((tab) => tab.key)).not.toContain('custom_notes');
  });

  it('keeps legacy custom when fields still exist under that tab', () => {
    const apiTabs = [
      {
        key: CONTACT_LEGACY_CUSTOM_FORM_TAB.key,
        label: 'Custom fields',
        enabled: true,
        order: 6,
        isSystem: true,
      },
    ];
    const merged = mergeContactsFormTabsFromApi(DEFAULT_FORM_TABS, apiTabs, {
      custom: [{ key: 'extra', label: 'Extra', type: 'text', enabled: true, order: 0 }],
    });
    expect(merged.map((tab) => tab.key)).toContain('custom');
    expect(merged.find((tab) => tab.key === 'custom')?.label).toBe('Custom');
  });
});
