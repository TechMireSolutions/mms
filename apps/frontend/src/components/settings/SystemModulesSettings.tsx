import React, { useMemo, useState } from 'react';
import { normalizeEnabledModules, SYSTEM_MODULES_BY_ID } from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { useSettingsGlobalDraft } from '@/lib/contexts/SettingsGlobalDraftContext';
import SettingsFormActions from '@/components/ui/SettingsFormActions';
import ModuleSettingsNavGrid from '@/components/settings/modules/ModuleSettingsNavGrid';
import SettingsConfirmResetModal from '@/components/settings/SettingsConfirmResetModal';
import { SettingsPanel } from '@/components/ui/SettingsShell';

/**
 * Enable/disable application modules. Layout mirrors app navigation (`SYSTEM_MODULE_NAV`).
 */
export default function SystemModulesSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const {
    data,
    isModulesDirty,
    saved,
    saving,
    upd,
    handleSaveModules,
    handleResetModules,
    clearSaved,
  } = useSettingsGlobalDraft();

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

  const confirmReset = async (): Promise<void> => {
    setResetting(true);
    try {
      const ok = await handleResetModules();
      if (ok) setConfirmResetOpen(false);
    } finally {
      setResetting(false);
    }
  };

  return (
    <SettingsPanel
      width="wide"
      introKey="settings.introModules"
      isDirty={isModulesDirty}
      saved={saved}
      footer={
        <SettingsFormActions
          resetLabel={t('module.system.resetModules')}
          saveLabel={t('module.system.save')}
          savingLabel={t('module.system.saving')}
          onReset={() => setConfirmResetOpen(true)}
          onSave={() => void handleSaveModules()}
          dirty={isModulesDirty}
          saving={saving}
          saved={saved}
        />
      }
    >
      <ModuleSettingsNavGrid enabledModules={enabledModules} onToggleModule={updModule} />

      <SettingsConfirmResetModal
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={confirmReset}
        titleKey="module.system.confirmResetTitle"
        descKey="module.system.confirmResetDesc"
        warningKey="module.system.resetWarning"
        loading={resetting}
      />
    </SettingsPanel>
  );
}
