import React, { useMemo } from 'react';
import { normalizeEnabledModules, SYSTEM_MODULES_BY_ID } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsGlobalDraft } from '@/lib/contexts/SettingsGlobalDraftContext';
import { SettingsFormActions } from '@/components/ui/SettingsFormActions';
import ModuleSettingsNavGrid from '@/components/settings/modules/ModuleSettingsNavGrid';
import { SettingsPanel } from '@/components/ui/SettingsShell';

/**
 * Enable/disable application modules. Layout mirrors app navigation (`SYSTEM_MODULE_NAV`).
 */
export default function SystemModulesSettings(): React.JSX.Element {
  const { t } = useTranslation();

  const {
    data,
    isModulesDirty,
    saved,
    saving,
    upd,
    handleSaveModules,
    clearSaved,
  } = useSettingsGlobalDraft();

  const enabledModules = useMemo(
    () => normalizeEnabledModules(data.enabledModules),
    [data.enabledModules],
  );

  const updModule = (moduleId: string, enabled: boolean): void => {
    const mod = SYSTEM_MODULES_BY_ID[moduleId];
    if (mod?.required) return;
    upd('enabledModules', normalizeEnabledModules({ ...enabledModules, [moduleId]: enabled }));
    clearSaved();
  };

  return (
    <SettingsPanel
      width="wide"
      introKey="settings.introModules"
      isDirty={isModulesDirty}
      saved={saved}
      footer={
        <SettingsFormActions
          saveLabel={t('module.system.save')}
          savingLabel={t('module.system.saving')}
          onSave={() => void handleSaveModules()}
          dirty={isModulesDirty}
          saving={saving}
          saved={saved}
        />
      }
    >
      <ModuleSettingsNavGrid enabledModules={enabledModules} onToggleModule={updModule} />
    </SettingsPanel>
  );
}
