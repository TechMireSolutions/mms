import React from "react";
import { Card } from "@/components/ui/card";
import { Save, FileText } from "lucide-react";
import {
  EXAMINATIONS_TAB_REGISTRY,
  INITIAL_EXAMINATIONS_FIELD_SEED,
} from "@mms/shared";
import { useExaminationConfig } from "@/tenant/features/examinations/hooks/useExaminationConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";

interface ExaminationsSettingsProps {
  mode?: "fields" | "preferences";
}

export function ExaminationsSettings({ mode }: ExaminationsSettingsProps): React.ReactElement {
  const config = useExaminationConfig();
  const {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettings,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: EXAMINATIONS_TAB_REGISTRY,
  });

  const handleSave = () => {
    saveSettings();
  };


  const showPrefs = mode === "preferences";
  const showFields = mode === "fields";

  return (
    <Card accentColor="primary" className="p-5 space-y-4 shadow-sm hover:shadow-md border-border/80" aria-labelledby="exams-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/40 pl-1">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="exams-settings-title" className="text-[13px] font-bold text-foreground">Examinations Module Settings</h3>
      </div>

      {showPrefs && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="exams-grading-system" className={FORM_LABEL}>Grading System</label>
              <FormSelect
                id="exams-grading-system"
                value={settingsDraft.gradingSystem}
                onChange={(value) => upd("gradingSystem", value)}
                options={[
                  { value: "percentage", label: "Percentage (%)" },
                  { value: "letter", label: "Letter Grade (A, B, C...)" },
                  { value: "gpa", label: "GPA (4.0 Scale)" },
                ]}
              />
            </div>
            <div>
              <label htmlFor="exams-cert-template" className={FORM_LABEL}>Certificate Template</label>
              <FormSelect
                id="exams-cert-template"
                value={settingsDraft.certificateTemplate}
                onChange={(value) => upd("certificateTemplate", value)}
                options={[
                  { value: "default", label: "Standard Classical" },
                  { value: "modern", label: "Modern Clean" },
                  { value: "minimal", label: "Minimalist Document" },
                ]}
              />
            </div>
            <div>
              <label htmlFor="exams-pass-mark" className={FORM_LABEL}>Pass Mark</label>
              <Input
                id="exams-pass-mark"
                className={FORM_INPUT}
                value={settingsDraft.passMark || ""}
                onChange={(event) => upd("passMark", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="exams-max-mark" className={FORM_LABEL}>Max Mark</label>
              <Input
                id="exams-max-mark"
                className={FORM_INPUT}
                value={settingsDraft.maxMark || ""}
                onChange={(event) => upd("maxMark", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 pt-1" role="group" aria-label="Examinations registry feature flags toggles">
            <ToggleRow label="Show Rankings" description="Show student class rank on result cards" value={settingsDraft.showRankings} onChange={(value) => upd("showRankings", value)} />
            <ToggleRow label="Allow Retakes" description="Enable student retakes for failed exams" value={settingsDraft.allowRetake} onChange={(value) => upd("allowRetake", value)} />
            <ToggleRow label="Auto-publish Results" description="Automatically publish results once grading is finished" value={settingsDraft.autoPublishResults} onChange={(value) => upd("autoPublishResults", value)} />
            <ToggleRow label="Notify on Publish" description="Send push notification when results are published" value={settingsDraft.notifyOnResult} onChange={(value) => upd("notifyOnResult", value)} />
            <ToggleRow label="AI Grading Assistant" description="Leverage AI models to analyze and grade open-text answers" value={settingsDraft.aiGrading} onChange={(value) => upd("aiGrading", value)} />
            <ToggleRow label="Distinguish Honours" description="Highlight distinctions/honours on profiles and result sheets" value={settingsDraft.distinguishHonours} onChange={(value) => upd("distinguishHonours", value)} />
            <ToggleRow label="Exam Schedule Reminders" description="Auto-send date reminders to guardians prior to exam start" value={settingsDraft.examReminders} onChange={(value) => upd("examReminders", value)} />
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
          onClick={handleSave}
          className={saved ? "bg-success hover:bg-success/90 text-success-foreground ml-auto" : "ml-auto"}
        >
          <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? "Saved!" : "Save Settings"}
        </Button>
      </footer>
    </Card>
  );
}
