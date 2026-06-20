import React, { useCallback, useMemo } from 'react';
import { getEffectiveGlobalSettings } from '@/lib/db';
import { normalizeEnabledModules, SYSTEM_MODULES_BY_ID, type GlobalSettings } from '@mms/shared';
import { notify } from '@/lib/notify';
import useTranslation from '@/hooks/useTranslation';
import { useSettingsDraft } from '@/hooks/useSettingsDraft';
import { useSavedFlash } from '@/hooks/useSavedFlash';
import SettingsFormActions from '@/components/ui/SettingsFormActions';
import ModuleSettingsNavGrid from '@/components/settings/modules/ModuleSettingsNavGrid';
import { SettingsCallout, SettingsPanel } from '@/components/ui/SettingsShell';
import {
  previewEnabledModulesDraft,
  resetEnabledModulesToDefaults,
  saveEnabledModulesDraft,
} from '@/lib/settingsModulesDraft';

/**
 * Enable/disable application modules. Layout mirrors app navigation (`SYSTEM_MODULE_NAV`).
 */
export default function SystemModulesSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const { saved: savedFlash, flashSaved, clearSaved } = useSavedFlash();

  const load = useCallback(() => getEffectiveGlobalSettings(), []);

  const onPreview = useCallback((draft: GlobalSettings) => {
    previewEnabledModulesDraft(draft);
  }, []);

  const onSave = useCallback(
    async (draft: GlobalSettings) => {
      saveEnabledModulesDraft(draft);
      flashSaved();
      notify.success(t('module.system.saved'), { description: t('module.system.savedDesc') });
    },
    [flashSaved, t],
  );

  const { data, dirty, saving, upd, handleSave, resetDraft } = useSettingsDraft({
    load,
    onPreview,
    onSave,
    skipDatabaseSyncWhenDirty: true,
  });

  const enabledModules = useMemo(
    () => normalizeEnabledModules(data.enabledModules),
    [data.enabledModules],
  );

  const updModule = (id: string, enabled: boolean): void => {
    const mod = SYSTEM_MODULES_BY_ID[id];
    if (mod?.required) return;
    upd('enabledModules', normalizeEnabledModules({ ...enabledModules, [id]: enabled }));
    clearSaved();
  };

  const handleReset = (): void => {
    resetEnabledModulesToDefaults();
    resetDraft();
    clearSaved();
    notify.success(t('module.system.resetToast'), { description: t('module.system.resetToastDesc') });
  };

  return (
    <SettingsPanel
      width="wide"
      introKey="settings.introModules"
      isDirty={dirty}
      saved={savedFlash}
      footer={
        <SettingsFormActions
          resetLabel={t('module.system.resetModules')}
          saveLabel={t('module.system.save')}
          savingLabel={t('module.system.saving')}
          savedLabel={t('module.system.savedLabel')}
          onReset={handleReset}
          onSave={() => void handleSave()}
          dirty={dirty}
          saving={saving}
          saved={savedFlash}
        />
      }
    >
      <SettingsCallout>{t('module.system.note')}</SettingsCallout>
      <ModuleSettingsNavGrid enabledModules={enabledModules} onToggleModule={updModule} />
    </SettingsPanel>
  );
}
