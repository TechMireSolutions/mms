import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_FORM_TABS } from '@mms/shared';

const mockGetConfig = vi.fn();
const mockUpsertConfig = vi.fn();
const mockLoadCustomTabs = vi.fn();
const mockGetPrefs = vi.fn();
const mockUpsertPrefs = vi.fn();
const mockLoadLookupKind = vi.fn();
const mockReplaceLookupKind = vi.fn();

vi.mock('../db/repositories/contactFieldConfigRepository.js', () => ({
  getContactFieldConfigByWorkspace: (...args: unknown[]) => mockGetConfig(...args),
  upsertContactFieldConfig: (...args: unknown[]) => mockUpsertConfig(...args),
}));

vi.mock('../db/repositories/contactModulePreferencesRepository.js', () => ({
  getContactModulePreferencesByWorkspace: (...args: unknown[]) => mockGetPrefs(...args),
  upsertContactModulePreferences: (...args: unknown[]) => mockUpsertPrefs(...args),
}));

vi.mock('../services/customTabsService.js', () => ({
  loadCustomTabs: (...args: unknown[]) => mockLoadCustomTabs(...args),
}));

vi.mock('../lib/contactLookupsService.js', () => ({
  loadContactLookupKind: (...args: unknown[]) => mockLoadLookupKind(...args),
  replaceContactLookupKind: (...args: unknown[]) => mockReplaceLookupKind(...args),
}));

vi.mock('../lib/tenantContext.js', () => ({
  getRequestTenant: () => 'demo',
}));

import {
  loadContactFieldConfig,
  saveContactFieldConfig,
} from '../lib/contactConfigService.js';
import {
  loadContactPreferences,
  saveContactPreferences,
} from '../lib/contactPreferencesService.js';

describe('contact setup config services', () => {
  beforeEach(() => {
    mockGetConfig.mockReset();
    mockUpsertConfig.mockReset();
    mockLoadCustomTabs.mockReset();
    mockGetPrefs.mockReset();
    mockUpsertPrefs.mockReset();
    mockLoadLookupKind.mockReset();
    mockReplaceLookupKind.mockReset();
    mockLoadCustomTabs.mockResolvedValue([]);
    mockLoadLookupKind.mockResolvedValue([]);
    mockReplaceLookupKind.mockResolvedValue([]);
  });

  it('returns null when field config row missing', async () => {
    mockGetConfig.mockResolvedValue(null);
    await expect(loadContactFieldConfig()).resolves.toBeNull();
  });

  it('strips formTabs on save and reloads', async () => {
    mockUpsertConfig.mockResolvedValue(undefined);
    mockGetConfig.mockResolvedValue({
      version: 1,
      enabledTabs: ['basic'],
      fields: {},
    });
    const saved = await saveContactFieldConfig({
      version: 1,
      enabledTabs: ['basic'],
      requiredTabs: [],
      fields: {},
      formTabs: [{ key: 'basic', label: 'Basic', enabled: true, order: 0 }],
    } as never);
    expect(mockUpsertConfig).toHaveBeenCalledWith(
      'demo',
      expect.not.objectContaining({ formTabs: expect.anything() }),
    );
    expect(saved.enabledTabs).toEqual(['basic']);
  });

  it('does not re-append custom tabs deleted from custom_tabs but still on document formTabs', async () => {
    mockGetConfig.mockResolvedValue({
      version: 1,
      enabledTabs: ['basic', 'custom_notes'],
      requiredTabs: [],
      fields: {
        basic: [{ key: 'firstName', label: 'First Name', type: 'text', enabled: true, order: 0 }],
      },
      formTabs: [
        { key: 'basic', label: 'Identity', enabled: true, order: 0, isSystem: true },
        { key: 'custom_notes', label: 'Notes', enabled: true, order: 10, isSystem: false },
      ],
    });
    mockLoadCustomTabs.mockResolvedValue(
      DEFAULT_FORM_TABS.map((tab) => ({
        key: tab.key,
        label: tab.label,
        enabled: true,
        sortOrder: tab.order,
        isSystem: true,
        icon: null,
        permissions: null,
        description: null,
        color: null,
      })),
    );

    const loaded = await loadContactFieldConfig();
    expect(loaded?.formTabs?.map((tab) => tab.key)).not.toContain('custom_notes');
    expect(loaded?.formTabs?.map((tab) => tab.key)).toEqual(
      DEFAULT_FORM_TABS.map((tab) => tab.key),
    );
  });

  it('normalizes preferences on save', async () => {
    mockUpsertPrefs.mockResolvedValue(undefined);
    const saved = await saveContactPreferences({ defaultCountry: 'PK' } as never);
    expect(saved.defaultCountry).toBe('PK');
    expect(mockUpsertPrefs).toHaveBeenCalledWith('demo', expect.objectContaining({ defaultCountry: 'PK' }));
  });

  it('syncs relationship mirrors when preferences are saved', async () => {
    mockUpsertPrefs.mockResolvedValue(undefined);
    mockLoadLookupKind.mockResolvedValue(['Stale']);
    mockGetConfig.mockResolvedValue({
      version: 1,
      enabledTabs: ['relationship'],
      requiredTabs: [],
      fields: {
        relationship: [
          {
            key: 'relationship',
            label: 'Relationship',
            type: 'select',
            enabled: true,
            order: 1,
            options: ['Stale'],
          },
        ],
      },
    });

    await saveContactPreferences({
      defaultCountry: 'Pakistan',
      relationshipPairs: [{ id: 'pair_custom', forward: 'Mentor', inverse: 'Mentee' }],
    } as never);

    expect(mockReplaceLookupKind).toHaveBeenCalledWith('relationships', [
      'Parent',
      'Child',
      'Husband',
      'Wife',
      'Guardian',
      'Dependent',
    ]);
    expect(mockUpsertConfig).toHaveBeenCalled();
  });

  it('returns null preferences when empty', async () => {
    mockGetPrefs.mockResolvedValue(null);
    await expect(loadContactPreferences()).resolves.toBeNull();
  });

  it('rewrites custom relationship pairs to the system catalog and mirrors', async () => {
    mockGetPrefs.mockResolvedValue({
      defaultCountry: 'Pakistan',
      relationshipPairs: [
        { id: 'father_child', forward: 'Father', inverse: 'Child' },
        { id: 'pair_custom', forward: 'Mentor', inverse: 'Mentee' },
      ],
    });
    mockLoadLookupKind.mockResolvedValue(['Father', 'Child', 'Mentor', 'Mentee']);
    mockGetConfig.mockResolvedValue({
      version: 1,
      enabledTabs: ['relationship'],
      requiredTabs: [],
      fields: {
        relationship: [
          { key: 'contactId', label: 'Contact', type: 'text', enabled: true, order: 0 },
          {
            key: 'relationship',
            label: 'Relationship',
            type: 'select',
            enabled: true,
            order: 1,
            options: ['Father', 'Child', 'Mentor', 'Mentee'],
          },
        ],
      },
    });

    const loaded = await loadContactPreferences();
    expect(loaded?.relationshipPairs).toEqual([
      { id: 'parent_child', forward: 'Parent', inverse: 'Child' },
      { id: 'husband_wife', forward: 'Husband', inverse: 'Wife' },
      { id: 'guardian_dependent', forward: 'Guardian', inverse: 'Dependent' },
    ]);
    expect(mockUpsertPrefs).toHaveBeenCalled();
    expect(mockReplaceLookupKind).toHaveBeenCalledWith('relationships', [
      'Parent',
      'Child',
      'Husband',
      'Wife',
      'Guardian',
      'Dependent',
    ]);
    expect(mockUpsertConfig).toHaveBeenCalled();
  });

  it('rewrites stale relationship lookups when prefs pairs are empty', async () => {
    mockGetPrefs.mockResolvedValue({
      defaultCountry: 'Pakistan',
      relationshipPairs: [],
    });
    mockLoadLookupKind.mockResolvedValue(['Father', 'Mother', 'Spouse']);
    mockGetConfig.mockResolvedValue(null);

    await loadContactPreferences();
    expect(mockUpsertPrefs).toHaveBeenCalled();
    expect(mockReplaceLookupKind).toHaveBeenCalledWith('relationships', [
      'Parent',
      'Child',
      'Husband',
      'Wife',
      'Guardian',
      'Dependent',
    ]);
  });
});
