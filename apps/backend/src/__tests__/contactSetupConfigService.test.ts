import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetConfig = vi.fn();
const mockUpsertConfig = vi.fn();
const mockLoadCustomTabs = vi.fn();
const mockGetPrefs = vi.fn();
const mockUpsertPrefs = vi.fn();

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

vi.mock('../lib/tenantContext.js', () => ({
  getRequestTenant: () => 'demo',
}));

import {
  loadContactFieldConfig,
  saveContactFieldConfig,
} from '../services/contactConfigService.js';
import {
  loadContactPreferences,
  saveContactPreferences,
} from '../services/contactPreferencesService.js';

describe('contact setup config services', () => {
  beforeEach(() => {
    mockGetConfig.mockReset();
    mockUpsertConfig.mockReset();
    mockLoadCustomTabs.mockReset();
    mockGetPrefs.mockReset();
    mockUpsertPrefs.mockReset();
    mockLoadCustomTabs.mockResolvedValue([]);
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

  it('normalizes preferences on save', async () => {
    mockUpsertPrefs.mockResolvedValue(undefined);
    const saved = await saveContactPreferences({ defaultCountry: 'PK' } as never);
    expect(saved.defaultCountry).toBe('PK');
    expect(mockUpsertPrefs).toHaveBeenCalledWith('demo', expect.objectContaining({ defaultCountry: 'PK' }));
  });

  it('returns null preferences when empty', async () => {
    mockGetPrefs.mockResolvedValue(null);
    await expect(loadContactPreferences()).resolves.toBeNull();
  });
});
