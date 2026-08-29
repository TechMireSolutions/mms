import React from "react";
import { School } from "lucide-react";
import { TEACHERS_MODULE_MANIFEST } from "@mms/shared";
import { useTeacherLookupOptions } from "@/tenant/features/teachers/hooks/useTeacherStatusConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { SectionCard } from "@/components/ui/SectionCard";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useTeachersSetupPanelState } from "@/tenant/features/teachers/hooks/useTeachersSetupPanelState";
import { TeachersPreferencesSection } from "@/tenant/features/teachers/components/TeachersPreferencesSection";

export interface TeachersSettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const TeachersSettings = React.memo(function TeachersSettings({
  onPrefsDirtyChange,
}: TeachersSettingsProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(TEACHERS_MODULE_MANIFEST);
  const { specializationOptions } = useTeacherLookupOptions();
  const {
    settingsDraft,
    saved,
    saving,
    isPrefsDirty,
    upd,
    handleSave,
  } = useTeachersSetupPanelState();

  React.useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isPrefsDirty
    ? t("teachers.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <div className="space-y-4">
      {!canEditSetup ? (
        <SetupReadOnlyMessage title={t("teachers.setupReadOnly")} />
      ) : (
        <SectionCard title={t("teachers.settings.title")} icon={School} accentColor="primary">
          <div className="space-y-4">
            <TeachersPreferencesSection
              settingsDraft={settingsDraft}
              upd={upd}
              specializationOptions={specializationOptions}
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

export default TeachersSettings;
