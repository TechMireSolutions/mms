import React, { useEffect } from "react";
import { DollarSign } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { FinancePreferencesSection } from "@/tenant/features/finance/components/FinancePreferencesSection";
import { useFinanceSetupPanelState } from "@/tenant/features/finance/hooks/useFinanceSetupPanelState";

export interface FinanceSettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const FinanceSettings = (function FinanceSettings({
  onPrefsDirtyChange,
}: FinanceSettingsProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const {
    settings,
    settingsDraft,
    saved,
    saving,
    isPrefsDirty,
    upd,
    handleSave,
  } = useFinanceSetupPanelState();

  useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isPrefsDirty
    ? t("finance.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <div className="space-y-6 max-w-3xl text-start">
      <SectionCard
        accentColor="primary"
        icon={DollarSign}
        title={t("finance.settings.title")}
        className={SETUP_SECTION_CARD_CLASS}
      >
        <FinancePreferencesSection
          settings={settings}
          settingsDraft={settingsDraft}
          upd={upd}
        />
      </SectionCard>

      <ModuleSetupSaveFooter
        dirty={isPrefsDirty}
        saving={saving}
        saved={saved}
        unsavedWarning={unsavedWarning}
        saveLabel={t("common.save")}
        savedLabel={t("settings.savedBadge")}
        onSave={handleSave}
      />
    </div>
  );
});

export default FinanceSettings;
