import React, { useEffect } from "react";
import { DollarSign } from "lucide-react";
import { FINANCE_MODULE_MANIFEST } from "@mms/shared";
import { SectionCard } from "@/components/ui/SectionCard";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { FinancePreferencesSection } from "@/tenant/features/finance/components/FinancePreferencesSection";
import { useFinanceSetupPanelState } from "@/tenant/features/finance/hooks/useFinanceSetupPanelState";

export interface FinanceSettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const FinanceSettings = React.memo(function FinanceSettings({
  onPrefsDirtyChange,
}: FinanceSettingsProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(FINANCE_MODULE_MANIFEST);
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
    <div className="space-y-4 max-w-3xl text-start">
      {!canEditSetup ? (
        <SetupReadOnlyMessage title={t("finance.setup.readOnly")} />
      ) : (
        <SectionCard
          accentColor="primary"
          icon={DollarSign}
          title={t("finance.settings.title")}
          className="shadow-sm hover:shadow-md border-border/80"
        >
          <div className="space-y-4">
            <FinancePreferencesSection
              settings={settings}
              settingsDraft={settingsDraft}
              upd={upd}
            />

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
        </SectionCard>
      )}
    </div>
  );
});

export default FinanceSettings;
