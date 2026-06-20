import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSavedFlash } from '@/hooks/useSavedFlash';
import {
  DEFAULT_GLOBAL_SETTINGS,
  formatBrandingFooterDefault,
  formatThemeDisplayModeSummary,
  mergeGlobalSettings,
  normalizeThemeMode,
  resetBrandingAppearance,
  resolveBrandingThemeMode,
  type BrandingSettings,
  type ThemeMode,
} from '@mms/shared';
import {
  getEffectiveGlobalSettings,
  getGlobalSettings,
  saveBrandingSettings,
  saveGlobalSettings,
} from '@/lib/db';
import { clearGlobalSettingsPreview, previewGlobalSettings } from '@/lib/settingsPreview';
import { serverSyncErrorKey } from '@/lib/serverSyncErrors';
import { notify } from '@/lib/notify';
import useTranslation from '@/hooks/useTranslation';
import { useSettingsBrandingDraft } from '@/lib/contexts/SettingsBrandingDraftContext';

export interface UseThemeSettingsDraftResult {
  data: BrandingSettings;
  displayMode: ThemeMode;
  setDisplayMode: (mode: ThemeMode) => void;
  previewMode: 'light' | 'dark';
  displayModeSummary: string;
  isDirty: boolean;
  saving: boolean;
  saved: boolean;
  upd: ReturnType<typeof useSettingsBrandingDraft>['upd'];
  handleSave: () => Promise<void>;
  handleReset: () => Promise<boolean>;
  defaultFooterPreview: string;
}

function loadPersistedThemeMode(): ThemeMode {
  return normalizeThemeMode(getGlobalSettings().theme);
}

function loadEffectiveThemeMode(): ThemeMode {
  return normalizeThemeMode(getEffectiveGlobalSettings().theme);
}

/**
 * Theme tab draft — display mode (global) + appearance fields (branding record).
 */
export function useThemeSettingsDraft(
  saveSuccessMessage: string,
  saveSuccessDescription: string,
): UseThemeSettingsDraftResult {
  const { t, language } = useTranslation();
  const { saved: savedFlash, flashSaved, clearSaved: clearSavedFlash } = useSavedFlash();
  const branding = useSettingsBrandingDraft();

  const [themeBaseline, setThemeBaseline] = useState(loadPersistedThemeMode);
  const [displayMode, setDisplayModeState] = useState(loadEffectiveThemeMode);
  const [themeSaving, setThemeSaving] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  const displayModeDirty = displayMode !== themeBaseline;
  const isDirty = branding.isThemeFieldsDirty || displayModeDirty;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => setSystemPrefersDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const sync = (): void => {
      if (displayModeDirty) return;
      setDisplayModeState(loadEffectiveThemeMode());
      setThemeBaseline(loadPersistedThemeMode());
    };
    window.addEventListener('local-database-update', sync);
    return () => window.removeEventListener('local-database-update', sync);
  }, [displayModeDirty]);

  useEffect(() => {
    const effective = getEffectiveGlobalSettings();
    previewGlobalSettings({
      theme: normalizeThemeMode(displayMode),
      language: effective.language,
    });
  }, [displayMode]);

  const previewMode = resolveBrandingThemeMode(displayMode, systemPrefersDark);

  const displayModeSummary = useMemo(
    () => formatThemeDisplayModeSummary(displayMode, previewMode, language),
    [displayMode, language, previewMode],
  );

  const defaultFooterPreview = useMemo(
    () => formatBrandingFooterDefault(branding.data.madrasaName, language),
    [branding.data.madrasaName, language],
  );

  const setDisplayMode = useCallback((mode: ThemeMode): void => {
    setDisplayModeState(normalizeThemeMode(mode));
    clearSavedFlash();
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    const wasBrandingDirty = branding.isThemeFieldsDirty;

    if (wasBrandingDirty) {
      const ok = await branding.handleSave({ saveSuccessMessage, saveSuccessDescription });
      if (!ok) return;
    }

    if (displayModeDirty) {
      setThemeSaving(true);
      try {
        const current = getGlobalSettings();
        saveGlobalSettings(
          mergeGlobalSettings({ ...current, theme: normalizeThemeMode(displayMode) }),
        );
        setThemeBaseline(normalizeThemeMode(displayMode));
        clearGlobalSettingsPreview();

        if (!wasBrandingDirty) {
          notify.success(saveSuccessMessage, { description: saveSuccessDescription });
        }
      } finally {
        setThemeSaving(false);
      }
    }

    if (isDirty) {
      flashSaved();
    }
  }, [
    branding,
    displayMode,
    displayModeDirty,
    flashSaved,
    isDirty,
    saveSuccessDescription,
    saveSuccessMessage,
  ]);

  const handleReset = useCallback(async (): Promise<boolean> => {
    const appearanceReset = resetBrandingAppearance(branding.data, language);
    const defaultMode = DEFAULT_GLOBAL_SETTINGS.theme;

    try {
      const brandingResult = await saveBrandingSettings(appearanceReset);
      if (!brandingResult.ok) {
        notify.error(t('settings.serverSaveFailed'), {
          description: t(serverSyncErrorKey(brandingResult.status)),
        });
        return false;
      }

      const current = getGlobalSettings();
      saveGlobalSettings(mergeGlobalSettings({ ...current, theme: defaultMode }));
      setDisplayModeState(defaultMode);
      setThemeBaseline(defaultMode);
      clearGlobalSettingsPreview();
      branding.applyPersisted(appearanceReset);
      notify.success(t('theme.resetToast'), { description: t('theme.resetToastDesc') });
      return true;
    } catch {
      notify.error(t('theme.resetError'), { description: t('theme.resetErrorDesc') });
      return false;
    }
  }, [branding, language, t]);

  const saved = !isDirty && (branding.saved || savedFlash);

  return {
    data: branding.data,
    displayMode,
    setDisplayMode,
    previewMode,
    displayModeSummary,
    isDirty,
    saving: branding.saving || themeSaving,
    saved,
    upd: branding.upd,
    handleSave,
    handleReset,
    defaultFooterPreview,
  };
}
