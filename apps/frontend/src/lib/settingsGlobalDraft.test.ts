import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DEFAULT_GLOBAL_SETTINGS, type GlobalSettings } from '@mms/shared';
import { globalSettingsPreviewPatch, mergeGlobalSettingsDraft } from '@/lib/settingsGlobalDraft';

vi.mock('@/lib/db', () => ({
  getGlobalSettings: vi.fn(() => ({
    ...DEFAULT_GLOBAL_SETTINGS,
    enabledModules: { dashboard: true, students: true },
    theme: 'system',
  })),
}));

describe('settingsGlobalDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('globalSettingsPreviewPatch excludes enabledModules and theme', () => {
    const draft: GlobalSettings = {
      ...DEFAULT_GLOBAL_SETTINGS,
      language: 'ar',
      timezone: 'Asia/Karachi',
      theme: 'dark',
      enabledModules: { dashboard: false },
    };
    const patch = globalSettingsPreviewPatch(draft);
    expect(patch.language).toBe('ar');
    expect(patch.timezone).toBe('Asia/Karachi');
    expect(patch).not.toHaveProperty('enabledModules');
    expect(patch).not.toHaveProperty('theme');
  });

  it('mergeGlobalSettingsDraft preserves persisted modules and theme', () => {
    const draft: GlobalSettings = {
      ...DEFAULT_GLOBAL_SETTINGS,
      language: 'ur',
      theme: 'dark',
      enabledModules: { dashboard: false },
    };
    const merged = mergeGlobalSettingsDraft(draft);
    expect(merged.language).toBe('ur');
    expect(merged.theme).toBe('system');
    expect(merged.enabledModules.dashboard).toBe(true);
    expect(merged.enabledModules.students).toBe(true);
  });
});
