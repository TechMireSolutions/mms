import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_GLOBAL_SETTINGS,
  applyDocumentLanguage,
  mergeGlobalSettings,
  normalizeEnabledModules,
  type GlobalSettings,
} from '@mms/shared';
import { getGlobalSettings, saveGlobalSettingsAsync } from '@/lib/db';
import { clearGlobalSettingsPreview, previewGlobalSettings } from '@/lib/settingsPreview';
import { serverSyncErrorKey } from '@/lib/serverSyncErrors';
import { notify } from '@/lib/notify';
import useTranslation from '@/hooks/useTranslation';
import { useSavedFlash } from '@/hooks/useSavedFlash';
import {
  isEnabledModulesDraftDirty,
  isGlobalPreferencesDirty,
  mergeGlobalSettingsDraft,
  previewGlobalSettingsDraft,
  retainGlobalDraftAfterModulesSave,
  retainModulesDraftAfterGlobalSave,
} from '@/lib/settingsGlobalDraft';

export interface UseGlobalSettingsDraftSaveToast {
  saveSuccessMessage: string;
  saveSuccessDescription: string;
}

export interface UseGlobalSettingsDraftResult {
  data: GlobalSettings;
  baseline: GlobalSettings;
  isGlobalDirty: boolean;
  isModulesDirty: boolean;
  saved: boolean;
  saving: boolean;
  upd: <K extends keyof GlobalSettings>(field: K, value: GlobalSettings[K]) => void;
  handleSaveGlobal: (toast?: UseGlobalSettingsDraftSaveToast) => Promise<boolean>;
  handleSaveModules: (toast?: UseGlobalSettingsDraftSaveToast) => Promise<boolean>;
  handleResetGlobal: () => Promise<boolean>;
  handleResetModules: () => Promise<boolean>;
  applyPersisted: (next: GlobalSettings) => void;
  clearSaved: () => void;
}

function loadPersistedGlobal(): GlobalSettings {
  return mergeGlobalSettings(getGlobalSettings());
}

export function useGlobalSettingsDraft(): UseGlobalSettingsDraftResult {
  const { t } = useTranslation();
  const { saved, flashSaved, clearSaved } = useSavedFlash();
  const [baseline, setBaseline] = useState<GlobalSettings>(loadPersistedGlobal);
  const [data, setData] = useState<GlobalSettings>(loadPersistedGlobal);
  const [saving, setSaving] = useState(false);

  const isGlobalDirty = useMemo(
    () => isGlobalPreferencesDirty(data, baseline),
    [baseline, data],
  );
  const isModulesDirty = useMemo(
    () => isEnabledModulesDraftDirty(data, baseline),
    [baseline, data],
  );
  const isDirty = isGlobalDirty || isModulesDirty;

  useEffect(() => {
    const sync = (): void => {
      if (isDirty) return;
      const next = loadPersistedGlobal();
      setBaseline(next);
      setData(next);
      clearSaved();
    };
    window.addEventListener('local-database-update', sync);
    return () => window.removeEventListener('local-database-update', sync);
  }, [clearSaved, isDirty]);

  useEffect(() => {
    previewGlobalSettings(previewGlobalSettingsDraft(data));
    applyDocumentLanguage(data.language);
  }, [data]);

  const applyPersisted = useCallback((next: GlobalSettings): void => {
    const merged = mergeGlobalSettings(next);
    setBaseline(merged);
    setData(merged);
    clearGlobalSettingsPreview();
    clearSaved();
  }, [clearSaved]);

  const upd = useCallback(<K extends keyof GlobalSettings>(field: K, value: GlobalSettings[K]): void => {
    setData((current) => ({ ...current, [field]: value }));
    clearSaved();
  }, [clearSaved]);

  const handleSaveGlobal = useCallback(
    async (toast?: UseGlobalSettingsDraftSaveToast): Promise<boolean> => {
      setSaving(true);
      try {
        const persisted = mergeGlobalSettingsDraft(data);
        const result = await saveGlobalSettingsAsync(persisted);
        if (!result.ok) {
          notify.error(t('settings.serverSaveFailed'), {
            description: t(serverSyncErrorKey(result.status)),
          });
          return false;
        }
        const nextData = retainModulesDraftAfterGlobalSave(persisted, data);
        setBaseline(persisted);
        setData(nextData);
        clearGlobalSettingsPreview();
        applyDocumentLanguage(persisted.language);
        flashSaved();
        notify.success(toast?.saveSuccessMessage ?? t('global.savedToast'), {
          description: toast?.saveSuccessDescription ?? t('global.savedToastDesc'),
        });
        return true;
      } finally {
        setSaving(false);
      }
    },
    [data, flashSaved, t],
  );

  const handleSaveModules = useCallback(
    async (toast?: UseGlobalSettingsDraftSaveToast): Promise<boolean> => {
      setSaving(true);
      try {
        const persisted = mergeGlobalSettings({
          ...getGlobalSettings(),
          enabledModules: normalizeEnabledModules(data.enabledModules),
        });
        const result = await saveGlobalSettingsAsync(persisted);
        if (!result.ok) {
          notify.error(t('settings.serverSaveFailed'), {
            description: t(serverSyncErrorKey(result.status)),
          });
          return false;
        }
        const nextData = retainGlobalDraftAfterModulesSave(persisted, data);
        setBaseline(persisted);
        setData(nextData);
        clearGlobalSettingsPreview();
        flashSaved();
        notify.success(toast?.saveSuccessMessage ?? t('module.system.saved'), {
          description: toast?.saveSuccessDescription ?? t('module.system.savedDesc'),
        });
        return true;
      } finally {
        setSaving(false);
      }
    },
    [data, flashSaved, t],
  );

  const handleResetGlobal = useCallback(async (): Promise<boolean> => {
    const current = getGlobalSettings();
    const reset = mergeGlobalSettings({
      ...DEFAULT_GLOBAL_SETTINGS,
      enabledModules: current.enabledModules,
      theme: current.theme,
    });
    const result = await saveGlobalSettingsAsync(reset);
    if (!result.ok) {
      notify.error(t('settings.serverSaveFailed'), {
        description: t(serverSyncErrorKey(result.status)),
      });
      return false;
    }
    const nextData = retainModulesDraftAfterGlobalSave(reset, data);
    setBaseline(reset);
    setData(nextData);
    clearGlobalSettingsPreview();
    applyDocumentLanguage(reset.language);
    clearSaved();
    notify.success(t('global.resetToast'), { description: t('global.resetToastDesc') });
    return true;
  }, [clearSaved, data, t]);

  const handleResetModules = useCallback(async (): Promise<boolean> => {
    const persisted = mergeGlobalSettings({
      ...getGlobalSettings(),
      enabledModules: DEFAULT_GLOBAL_SETTINGS.enabledModules,
    });
    const result = await saveGlobalSettingsAsync(persisted);
    if (!result.ok) {
      notify.error(t('settings.serverSaveFailed'), {
        description: t(serverSyncErrorKey(result.status)),
      });
      return false;
    }
    const nextData = retainGlobalDraftAfterModulesSave(persisted, data);
    setBaseline(persisted);
    setData(nextData);
    clearGlobalSettingsPreview();
    clearSaved();
    notify.success(t('module.system.resetToast'), { description: t('module.system.resetToastDesc') });
    return true;
  }, [clearSaved, data, t]);

  return {
    data,
    baseline,
    isGlobalDirty,
    isModulesDirty,
    saved,
    saving,
    upd,
    handleSaveGlobal,
    handleSaveModules,
    handleResetGlobal,
    handleResetModules,
    applyPersisted,
    clearSaved,
  };
}
