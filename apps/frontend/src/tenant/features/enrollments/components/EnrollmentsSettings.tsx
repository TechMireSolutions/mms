import React, { useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { ENROLLMENTS_MODULE_MANIFEST } from "@mms/shared";
import { SectionCard } from "@/components/ui/SectionCard";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { EnrollmentsPreferencesSection } from "@/tenant/features/enrollments/components/EnrollmentsPreferencesSection";
import { useEnrollmentsSetupPanelState } from "@/tenant/features/enrollments/hooks/useEnrollmentsSetupPanelState";

export interface EnrollmentsSettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const EnrollmentsSettings = React.memo(function EnrollmentsSettings({
  onPrefsDirtyChange,
}: EnrollmentsSettingsProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(ENROLLMENTS_MODULE_MANIFEST);
  const {
    settingsDraft,
    saved,
    saving,
    isPrefsDirty,
    upd,
    handleSave,
  } = useEnrollmentsSetupPanelState();

  useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isPrefsDirty
    ? t("enrollments.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <div className="space-y-4 max-w-3xl text-start">
      {!canEditSetup ? (
        <SetupReadOnlyMessage title={t("enrollments.setupReadOnly")} />
      ) : (
        <SectionCard title={t("enrollments.settings.title")} icon={ClipboardList} accentColor="primary">
          <div className="space-y-4">
            <EnrollmentsPreferencesSection
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

export default EnrollmentsSettings;
