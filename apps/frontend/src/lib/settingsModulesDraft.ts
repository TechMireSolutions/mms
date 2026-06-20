import { DEFAULT_GLOBAL_SETTINGS, mergeGlobalSettings, normalizeEnabledModules, type GlobalSettings } from '@mms/shared';
import { getGlobalSettings, saveGlobalSettings } from '@/lib/db';
import { clearGlobalSettingsPreview, previewGlobalSettings } from '@/lib/settingsPreview';

/** Live-preview patch for enabled module toggles. */
export function previewEnabledModulesDraft(draft: GlobalSettings): void {
  previewGlobalSettings({ enabledModules: normalizeEnabledModules(draft.enabledModules) });
}

/** Persist enabled module toggles from draft. */
export function saveEnabledModulesDraft(draft: GlobalSettings): GlobalSettings {
  const merged = mergeGlobalSettings({
    ...getGlobalSettings(),
    enabledModules: normalizeEnabledModules(draft.enabledModules),
  });
  saveGlobalSettings(merged);
  clearGlobalSettingsPreview();
  return merged;
}

/** Reset enabled modules to defaults while preserving other global settings. */
export function resetEnabledModulesToDefaults(): GlobalSettings {
  const merged = mergeGlobalSettings({
    ...getGlobalSettings(),
    enabledModules: DEFAULT_GLOBAL_SETTINGS.enabledModules,
  });
  saveGlobalSettings(merged);
  clearGlobalSettingsPreview();
  return merged;
}
