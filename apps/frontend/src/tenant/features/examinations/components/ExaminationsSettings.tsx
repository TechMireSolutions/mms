import React from "react";
import { Card } from "@/components/ui/card";
import { Save, FileText } from "lucide-react";
import {
  EXAMINATIONS_TAB_REGISTRY,
  INITIAL_EXAMINATIONS_FIELD_SEED,
} from "@mms/shared";
import { useExaminationConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { notify } from "@/lib/notify";

interface ExaminationsSettingsProps {
  mode?: "fields" | "preferences";
}

export function ExaminationsSettings({ mode }: ExaminationsSettingsProps): React.ReactElement {
  const { t } = useTranslation();
  const config = useExaminationConfig();
  const {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettingsAsync,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: EXAMINATIONS_TAB_REGISTRY,
  });

  const handleSave = async () => {
    try {
      await saveSettingsAsync();
      notify.success(t("examinations.settings.saved"));
    } catch (error: unknown) {
      notify.error(t("examinations.settings.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const showPrefs = mode === "preferences";
  const showFields = mode === "fields";

  return (
    <Card accentColor="primary" className="p-5 space-y-4 shadow-sm hover:shadow-md border-border/80" aria-labelledby="exams-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/40 ps-1">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="exams-settings-title" className="text-sm font-bold text-foreground">
          {showFields ? t("examinations.settings.titleFields") : t("examinations.settings.titlePreferences")}
        </h3>
      </div>

      {showPrefs && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="exams-grading-system" className={FORM_LABEL}>{t("examinations.settings.gradingSystem")}</label>
              <FormSelect
                id="exams-grading-system"
                value={settingsDraft.gradingSystem}
                onChange={(value) => upd("gradingSystem", value)}
                options={[
                  { value: "percentage", label: t("examinations.settings.grading.percentage") },
                  { value: "letter", label: t("examinations.settings.grading.letter") },
                  { value: "gpa", label: t("examinations.settings.grading.gpa") },
                ]}
              />
            </div>
            <div>
              <label htmlFor="exams-cert-template" className={FORM_LABEL}>{t("examinations.settings.certificateTemplate")}</label>
              <FormSelect
                id="exams-cert-template"
                value={settingsDraft.certificateTemplate}
                onChange={(value) => upd("certificateTemplate", value)}
                options={[
                  { value: "default", label: t("examinations.settings.cert.default") },
                  { value: "modern", label: t("examinations.settings.cert.modern") },
                  { value: "minimal", label: t("examinations.settings.cert.minimal") },
                ]}
              />
            </div>
            <div>
              <label htmlFor="exams-pass-mark" className={FORM_LABEL}>{t("examinations.settings.passMark")}</label>
              <Input
                id="exams-pass-mark"
                className={FORM_INPUT}
                value={settingsDraft.passMark || ""}
                onChange={(event) => upd("passMark", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="exams-max-mark" className={FORM_LABEL}>{t("examinations.settings.maxMark")}</label>
              <Input
                id="exams-max-mark"
                className={FORM_INPUT}
                value={settingsDraft.maxMark || ""}
                onChange={(event) => upd("maxMark", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 pt-1" role="group" aria-label={t("examinations.settings.featureFlags")}>
            <ToggleRow label={t("examinations.settings.showRankings")} description={t("examinations.settings.showRankingsHint")} value={settingsDraft.showRankings} onChange={(value) => upd("showRankings", value)} />
            <ToggleRow label={t("examinations.settings.allowRetake")} description={t("examinations.settings.allowRetakeHint")} value={settingsDraft.allowRetake} onChange={(value) => upd("allowRetake", value)} />
            <ToggleRow label={t("examinations.settings.autoPublishResults")} description={t("examinations.settings.autoPublishResultsHint")} value={settingsDraft.autoPublishResults} onChange={(value) => upd("autoPublishResults", value)} />
            <ToggleRow label={t("examinations.settings.notifyOnResult")} description={t("examinations.settings.notifyOnResultHint")} value={settingsDraft.notifyOnResult} onChange={(value) => upd("notifyOnResult", value)} />
            <ToggleRow label={t("examinations.settings.aiGrading")} description={t("examinations.settings.aiGradingHint")} value={settingsDraft.aiGrading} onChange={(value) => upd("aiGrading", value)} />
            <ToggleRow label={t("examinations.settings.distinguishHonours")} description={t("examinations.settings.distinguishHonoursHint")} value={settingsDraft.distinguishHonours} onChange={(value) => upd("distinguishHonours", value)} />
            <ToggleRow label={t("examinations.settings.examReminders")} description={t("examinations.settings.examRemindersHint")} value={settingsDraft.examReminders} onChange={(value) => upd("examReminders", value)} />
          </div>
        </>
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={fieldsEditor}
          isCoreField={(tabId, key) => INITIAL_EXAMINATIONS_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
          onStateChange={() => setSaved(false)}
        />
      )}

      <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
        <Button
          type="button"
          onClick={() => { void handleSave(); }}
          className={saved ? "bg-success hover:bg-success/90 text-success-foreground ms-auto" : "ms-auto"}
        >
          <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? t("examinations.settings.btnSaved") : t("examinations.settings.btnSave")}
        </Button>
      </footer>
    </Card>
  );
}
