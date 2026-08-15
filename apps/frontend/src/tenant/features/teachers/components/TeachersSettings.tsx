import { type TeachersSettings as TeachersSettingsType } from "@mms/shared";
import React from "react";
import { School } from "lucide-react";
import {
  TEACHERS_TAB_REGISTRY,
  TEACHERS_MODULE_MANIFEST,
  TEACHER_LOCKED_ENABLED_TABS,
} from "@mms/shared";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { useTeacherLookupOptions } from "@/tenant/features/teachers/hooks/useTeacherStatusConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { SectionCard } from "@/components/ui/SectionCard";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useTeachersSetupSaveActions } from "@/tenant/features/teachers/hooks/useTeachersSetupSaveActions";
import { TeachersPreferencesSection } from "@/tenant/features/teachers/components/TeachersPreferencesSection";

export const TeachersSettings = React.memo(function TeachersSettings(): React.JSX.Element {
      const { t } = useTranslation();
      const { canEditSetup } = useModulePermissions(TEACHERS_MODULE_MANIFEST);
      const config = useTeacherConfig();
      const { specializationOptions } = useTeacherLookupOptions();
      const {
        settings,
        settingsDraft,
        fieldsEditor,
        saved,
        setSaved,
        upd,
      } = useModuleSettingsEditor<TeachersSettingsType>({
        config,
        tabRegistry: TEACHERS_TAB_REGISTRY,
        lockedEnabledTabs: TEACHER_LOCKED_ENABLED_TABS,
      });

      const {
        saving,
        isDirty,
        handleSave,
      } = useTeachersSetupSaveActions({
        settings,
        settingsDraft,
        fieldsEditor,
        mode: "preferences",
        setSaved,
      });

      const unsavedWarning = isDirty
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
                  dirty={isDirty}
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
