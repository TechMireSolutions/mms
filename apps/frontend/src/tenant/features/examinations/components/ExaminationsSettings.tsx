import React, { useEffect } from "react";
import { FileText } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { useExaminationsSetupPanelState } from "@/tenant/features/examinations/hooks/useExaminationsSetupPanelState";

export interface ExaminationsSettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const ExaminationsSettings = React.memo(function ExaminationsSettings({
  onPrefsDirtyChange,
}: ExaminationsSettingsProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const {
    settingsDraft,
    saved,
    saving,
    isPrefsDirty,
    upd,
    handleSave,
  } = useExaminationsSetupPanelState();

  useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isPrefsDirty
    ? t("examinations.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <SectionCard
      accentColor="primary"
      icon={FileText}
      title={t("examinations.settings.titlePreferences")}
      className="shadow-sm hover:shadow-md border-border/80 max-w-3xl text-start"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="exams-grading-system" className={FORM_LABEL}>
              {t("examinations.settings.gradingSystem")}
            </label>
            <FormSelect
              id="exams-grading-system"
              value={settingsDraft.gradingSystem}
              onChange={(value) => upd("gradingSystem", value)}
              options={[
                {
                  value: "percentage",
                  label: t("examinations.settings.grading.percentage"),
                },
                {
                  value: "letter",
                  label: t("examinations.settings.grading.letter"),
                },
                {
                  value: "gpa",
                  label: t("examinations.settings.grading.gpa"),
                },
              ]}
            />
          </div>
          <div>
            <label htmlFor="exams-cert-template" className={FORM_LABEL}>
              {t("examinations.settings.certificateTemplate")}
            </label>
            <FormSelect
              id="exams-cert-template"
              value={settingsDraft.certificateTemplate}
              onChange={(value) => upd("certificateTemplate", value)}
              options={[
                {
                  value: "default",
                  label: t("examinations.settings.cert.default"),
                },
                {
                  value: "modern",
                  label: t("examinations.settings.cert.modern"),
                },
                {
                  value: "minimal",
                  label: t("examinations.settings.cert.minimal"),
                },
              ]}
            />
          </div>
          <div>
            <label htmlFor="exams-pass-mark" className={FORM_LABEL}>
              {t("examinations.settings.passMark")}
            </label>
            <Input
              id="exams-pass-mark"
              className={FORM_INPUT}
              value={settingsDraft.passMark || ""}
              onChange={(event) => upd("passMark", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="exams-max-mark" className={FORM_LABEL}>
              {t("examinations.settings.maxMark")}
            </label>
            <Input
              id="exams-max-mark"
              className={FORM_INPUT}
              value={settingsDraft.maxMark || ""}
              onChange={(event) => upd("maxMark", event.target.value)}
            />
          </div>
        </div>

        <div
          className="space-y-2 pt-1"
          role="group"
          aria-label={t("examinations.settings.featureFlags")}
        >
          <ToggleRow
            label={t("examinations.settings.showRankings")}
            description={t("examinations.settings.showRankingsHint")}
            value={settingsDraft.showRankings}
            onChange={(value) => upd("showRankings", value)}
          />
          <ToggleRow
            label={t("examinations.settings.allowRetake")}
            description={t("examinations.settings.allowRetakeHint")}
            value={settingsDraft.allowRetake}
            onChange={(value) => upd("allowRetake", value)}
          />
          <ToggleRow
            label={t("examinations.settings.autoPublishResults")}
            description={t("examinations.settings.autoPublishResultsHint")}
            value={settingsDraft.autoPublishResults}
            onChange={(value) => upd("autoPublishResults", value)}
          />
          <ToggleRow
            label={t("examinations.settings.notifyOnResult")}
            description={t("examinations.settings.notifyOnResultHint")}
            value={settingsDraft.notifyOnResult}
            onChange={(value) => upd("notifyOnResult", value)}
          />
          <ToggleRow
            label={t("examinations.settings.aiGrading")}
            description={t("examinations.settings.aiGradingHint")}
            value={settingsDraft.aiGrading}
            onChange={(value) => upd("aiGrading", value)}
          />
          <ToggleRow
            label={t("examinations.settings.distinguishHonours")}
            description={t("examinations.settings.distinguishHonoursHint")}
            value={settingsDraft.distinguishHonours}
            onChange={(value) => upd("distinguishHonours", value)}
          />
          <ToggleRow
            label={t("examinations.settings.examReminders")}
            description={t("examinations.settings.examRemindersHint")}
            value={settingsDraft.examReminders}
            onChange={(value) => upd("examReminders", value)}
          />
        </div>

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
  );
});

export default ExaminationsSettings;
