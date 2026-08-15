import { type EnrollmentsSettings as EnrollmentsSettingsType } from "@mms/shared";
import React from "react";
import { ClipboardList } from "lucide-react";
import {
  ENROLLMENTS_TAB_REGISTRY,
  ENROLLMENTS_MODULE_MANIFEST,
} from "@mms/shared";
import { useEnrollmentConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_LABEL, WORK_SURFACE } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

export const EnrollmentsSettings = React.memo(function EnrollmentsSettings(): React.JSX.Element {
      const { t } = useTranslation();
      const { canEditSetup } = useModulePermissions(ENROLLMENTS_MODULE_MANIFEST);
      const config = useEnrollmentConfig();
      const {
        settingsDraft,
        saved,
        upd,
        saveSettings,
      } = useModuleSettingsEditor<EnrollmentsSettingsType>({
        config,
        tabRegistry: ENROLLMENTS_TAB_REGISTRY,
      });

      const isDirty = !saved;

      const handleSave = (): void => {
        saveSettings();
        notify.success(t("enrollments.settings.saved"));
      };

      const unsavedWarning = isDirty ? t("enrollments.setup.unsavedPreferencesWarning") : undefined;

      return (
        <div className="space-y-4">
          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t("enrollments.setupReadOnly")} />
          ) : (
            <section className={`${WORK_SURFACE} p-5 space-y-4`}>
              <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="w-3.5 h-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t("enrollments.settings.title")}</h3>
              </div>

              <div className="space-y-4 text-start">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={FORM_LABEL} htmlFor="maxStudentsPerClass">
                      {t("enrollments.settings.maxStudentsPerClass")}
                    </label>
                    <Input
                      id="maxStudentsPerClass"
                      type="number"
                      value={settingsDraft.maxStudentsPerClass || ""}
                      onChange={(event) => upd("maxStudentsPerClass", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className={FORM_LABEL} htmlFor="dropDeadlineDays">
                      {t("enrollments.settings.dropDeadlineDays")}
                    </label>
                    <Input
                      id="dropDeadlineDays"
                      type="number"
                      value={settingsDraft.dropDeadlineDays || ""}
                      onChange={(event) => upd("dropDeadlineDays", event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <ToggleRow
                    label={t("enrollments.settings.waitlistEnabled")}
                    description={t("enrollments.settings.waitlistEnabledHint")}
                    value={settingsDraft.waitlistEnabled}
                    onChange={(value) => upd("waitlistEnabled", value)}
                  />
                  <ToggleRow
                    label={t("enrollments.settings.requireEligibilityCheck")}
                    description={t("enrollments.settings.requireEligibilityCheckHint")}
                    value={settingsDraft.requireEligibilityCheck}
                    onChange={(value) => upd("requireEligibilityCheck", value)}
                  />
                  <ToggleRow
                    label={t("enrollments.settings.autoAssignClass")}
                    description={t("enrollments.settings.autoAssignClassHint")}
                    value={settingsDraft.autoAssignClass}
                    onChange={(value) => upd("autoAssignClass", value)}
                  />
                  <ToggleRow
                    label={t("enrollments.settings.enrollmentApproval")}
                    description={t("enrollments.settings.enrollmentApprovalHint")}
                    value={settingsDraft.enrollmentApproval}
                    onChange={(value) => upd("enrollmentApproval", value)}
                  />
                  <ToggleRow
                    label={t("enrollments.settings.allowTransfers")}
                    description={t("enrollments.settings.allowTransfersHint")}
                    value={settingsDraft.allowTransfers}
                    onChange={(value) => upd("allowTransfers", value)}
                  />
                  <ToggleRow
                    label={t("enrollments.settings.reenrollmentReminder")}
                    description={t("enrollments.settings.reenrollmentReminderHint")}
                    value={settingsDraft.reenrollmentReminder}
                    onChange={(value) => upd("reenrollmentReminder", value)}
                  />
                </div>
              </div>

              <ModuleSetupSaveFooter
                dirty={isDirty}
                saving={false}
                saved={saved}
                unsavedWarning={unsavedWarning}
                saveLabel={t("common.save")}
                savedLabel={t("settings.savedBadge")}
                onSave={handleSave}
              />
            </section>
          )}
        </div>
      );
    });
