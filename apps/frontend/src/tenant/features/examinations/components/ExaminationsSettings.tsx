import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Save, FileText } from "lucide-react";
import {
  type ExaminationsSettings as ExaminationsSettingsData,
  EXAMINATIONS_TAB_REGISTRY,
  INITIAL_EXAMINATIONS_FIELD_SEED,
} from "@mms/shared";
import { useExaminationConfig } from "@/tenant/features/examinations/hooks/useExaminationConfig";
import { useModuleFieldsEditor } from "@/tenant/hooks/useModuleFieldsEditor";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Switch } from "@/components/ui/switch";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ label, description, value, onChange }: ToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label={`${label}: ${description || ""}`}
      />
    </div>
  );
}

interface ExaminationsSettingsProps {
  mode?: "fields" | "preferences";
}

export function ExaminationsSettings({ mode }: ExaminationsSettingsProps): React.ReactElement {
  const { settings, updateSettings } = useExaminationConfig();
  const [saved, setSaved] = useState<boolean>(false);

  // Prefs state
  const [passMark, setPassMark] = useState(settings.passMark);
  const [maxMark, setMaxMark] = useState(settings.maxMark);
  const [gradingSystem, setGradingSystem] = useState(settings.gradingSystem);
  const [showRankings, setShowRankings] = useState(settings.showRankings);
  const [allowRetake, setAllowRetake] = useState(settings.allowRetake);
  const [autoPublishResults, setAutoPublishResults] = useState(settings.autoPublishResults);
  const [notifyOnResult, setNotifyOnResult] = useState(settings.notifyOnResult);
  const [certificateTemplate, setCertificateTemplate] = useState(settings.certificateTemplate);
  const [aiGrading, setAiGrading] = useState(settings.aiGrading);
  const [distinguishHonours, setDistinguishHonours] = useState(settings.distinguishHonours);
  const [examReminders, setExamReminders] = useState(settings.examReminders);
  const [defaultViewLayout, setDefaultViewLayout] = useState(settings.defaultViewLayout);

  const fieldsEditor = useModuleFieldsEditor({
    initialTabs: EXAMINATIONS_TAB_REGISTRY,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || ["basic"])),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || [])),
  });

  useEffect(() => {
    if (!settings) return;
    setPassMark(settings.passMark);
    setMaxMark(settings.maxMark);
    setGradingSystem(settings.gradingSystem);
    setShowRankings(settings.showRankings);
    setAllowRetake(settings.allowRetake);
    setAutoPublishResults(settings.autoPublishResults);
    setNotifyOnResult(settings.notifyOnResult);
    setCertificateTemplate(settings.certificateTemplate);
    setAiGrading(settings.aiGrading);
    setDistinguishHonours(settings.distinguishHonours);
    setExamReminders(settings.examReminders);
    setDefaultViewLayout(settings.defaultViewLayout);

    const coreTabKeys = new Set(EXAMINATIONS_TAB_REGISTRY.map((tabDefinition) => tabDefinition.key));
    const customTabs = (settings.formTabs || []).filter((tabDefinition) => !coreTabKeys.has(tabDefinition.key));
    const updatedTabs = [
      ...EXAMINATIONS_TAB_REGISTRY,
      ...customTabs
    ].map((tabDefinition) => ({
      ...tabDefinition,
      enabled: tabDefinition.key === "basic" ? true : (settings.enabledTabs || ["basic"]).includes(tabDefinition.key)
    }));

    fieldsEditor.resetAllState(
      updatedTabs,
      settings.fields || {},
      settings.enabledTabs || ["basic"],
      settings.requiredTabs || []
    );
  }, [settings, fieldsEditor]);

  const handleSave = () => {
    const updatedFormTabs = fieldsEditor.formTabs.map((tabDefinition) => ({
      ...tabDefinition,
      enabled: fieldsEditor.enabledTabs.has(tabDefinition.key)
    }));

    const nextSettings: ExaminationsSettingsData = {
      ...settings,
      passMark,
      maxMark,
      gradingSystem,
      showRankings,
      allowRetake,
      autoPublishResults,
      notifyOnResult,
      certificateTemplate,
      aiGrading,
      distinguishHonours,
      examReminders,
      defaultViewLayout,
      enabledTabs: Array.from(fieldsEditor.enabledTabs),
      requiredTabs: Array.from(fieldsEditor.requiredTabs),
      formTabs: updatedFormTabs,
      fields: fieldsEditor.buildFieldsMap(),
    };

    updateSettings(nextSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
                value={gradingSystem}
                onChange={(value) => { setGradingSystem(value); setSaved(false); }}
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
                value={certificateTemplate}
                onChange={(value) => { setCertificateTemplate(value); setSaved(false); }}
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
                value={passMark}
                onChange={(event) => { setPassMark(event.target.value); setSaved(false); }}
              />
            </div>
            <div>
              <label htmlFor="exams-max-mark" className={FORM_LABEL}>Max Mark</label>
              <Input
                id="exams-max-mark"
                className={FORM_INPUT}
                value={maxMark}
                onChange={(event) => { setMaxMark(event.target.value); setSaved(false); }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-1" role="group" aria-label="Examinations registry feature flags toggles">
            <Toggle label="Show Rankings" description="Show student class rank on result cards" value={showRankings} onChange={(value) => { setShowRankings(value); setSaved(false); }} />
            <Toggle label="Allow Retakes" description="Enable student retakes for failed exams" value={allowRetake} onChange={(value) => { setAllowRetake(value); setSaved(false); }} />
            <Toggle label="Auto-publish Results" description="Automatically publish results once grading is finished" value={autoPublishResults} onChange={(value) => { setAutoPublishResults(value); setSaved(false); }} />
            <Toggle label="Notify on Publish" description="Send push notification when results are published" value={notifyOnResult} onChange={(value) => { setNotifyOnResult(value); setSaved(false); }} />
            <Toggle label="AI Grading Assistant" description="Leverage AI models to analyze and grade open-text answers" value={aiGrading} onChange={(value) => { setAiGrading(value); setSaved(false); }} />
            <Toggle label="Distinguish Honours" description="Highlight distinctions/honours on profiles and result sheets" value={distinguishHonours} onChange={(value) => { setDistinguishHonours(value); setSaved(false); }} />
            <Toggle label="Exam Schedule Reminders" description="Auto-send date reminders to guardians prior to exam start" value={examReminders} onChange={(value) => { setExamReminders(value); setSaved(false); }} />
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
