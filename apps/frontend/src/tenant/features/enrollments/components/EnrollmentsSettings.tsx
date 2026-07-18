import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Save, ClipboardList } from "lucide-react";
import { useEnrollmentConfig } from "@/tenant/features/enrollments/hooks/useEnrollmentConfig";
import {
  type EnrollmentsSettings as EnrollmentsSettingsData,
  ENROLLMENTS_TAB_REGISTRY,
  INITIAL_ENROLLMENTS_FIELD_SEED,
} from "@mms/shared";
import { useModuleFieldsEditor } from "@/tenant/hooks/useModuleFieldsEditor";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";

interface EnrollmentsSettingsProps {
  mode?: "fields" | "preferences";
}

export function EnrollmentsSettings({ mode }: EnrollmentsSettingsProps): React.JSX.Element {
  const { settings, updateSettings } = useEnrollmentConfig();
  const [saved, setSaved] = useState<boolean>(false);

  // Prefs state
  const [maxStudentsPerClass, setMaxStudentsPerClass] = useState(settings.maxStudentsPerClass);
  const [dropDeadlineDays, setDropDeadlineDays] = useState(settings.dropDeadlineDays);
  const [waitlistEnabled, setWaitlistEnabled] = useState(settings.waitlistEnabled);
  const [requireEligibilityCheck, setRequireEligibilityCheck] = useState(settings.requireEligibilityCheck);
  const [autoAssignClass, setAutoAssignClass] = useState(settings.autoAssignClass);
  const [enrollmentApproval, setEnrollmentApproval] = useState(settings.enrollmentApproval);
  const [allowTransfers, setAllowTransfers] = useState(settings.allowTransfers);
  const [reenrollmentReminder, setReenrollmentReminder] = useState(settings.reenrollmentReminder);

  const fieldsEditor = useModuleFieldsEditor({
    initialTabs: ENROLLMENTS_TAB_REGISTRY,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || ["basic"])),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || [])),
  });

  useEffect(() => {
    if (!settings) return;
    setMaxStudentsPerClass(settings.maxStudentsPerClass);
    setDropDeadlineDays(settings.dropDeadlineDays);
    setWaitlistEnabled(settings.waitlistEnabled);
    setRequireEligibilityCheck(settings.requireEligibilityCheck);
    setAutoAssignClass(settings.autoAssignClass);
    setEnrollmentApproval(settings.enrollmentApproval);
    setAllowTransfers(settings.allowTransfers);
    setReenrollmentReminder(settings.reenrollmentReminder);

    const coreTabKeys = new Set(ENROLLMENTS_TAB_REGISTRY.map((tabDefinition) => tabDefinition.key));
    const customTabs = (settings.formTabs || []).filter((tabDefinition) => !coreTabKeys.has(tabDefinition.key));
    const updatedTabs = [
      ...ENROLLMENTS_TAB_REGISTRY,
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

  const handleSave = (): void => {
    const updatedFormTabs = fieldsEditor.formTabs.map((tabDefinition) => ({
      ...tabDefinition,
      enabled: fieldsEditor.enabledTabs.has(tabDefinition.key)
    }));

    const nextSettings: EnrollmentsSettingsData = {
      ...settings,
      maxStudentsPerClass,
      dropDeadlineDays,
      waitlistEnabled,
      requireEligibilityCheck,
      autoAssignClass,
      enrollmentApproval,
      allowTransfers,
      reenrollmentReminder,
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
    <Card accentColor="primary" className="p-5 space-y-4 shadow-sm hover:shadow-md border-border/80">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/40 pl-1">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <ClipboardList className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-[13px] font-bold text-foreground">Enrollments Module Settings</h3>
      </div>

      {showPrefs && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FORM_LABEL} htmlFor="maxStudentsPerClass">Max Students Per Class</label>
              <Input
                id="maxStudentsPerClass"
                type="number"
                value={maxStudentsPerClass}
                onChange={(event) => { setMaxStudentsPerClass(event.target.value); setSaved(false); }}
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="dropDeadlineDays">Drop Deadline (days after enroll)</label>
              <Input
                id="dropDeadlineDays"
                type="number"
                value={dropDeadlineDays}
                onChange={(event) => { setDropDeadlineDays(event.target.value); setSaved(false); }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <ToggleRow
              label="Enable Waitlist"
              description="Allow students to join a waitlist when class is full"
              value={waitlistEnabled}
              onChange={(value) => { setWaitlistEnabled(value); setSaved(false); }}
            />
            <ToggleRow
              label="Require Eligibility Check"
              description="Run eligibility rules before confirming enrollment"
              value={requireEligibilityCheck}
              onChange={(value) => { setRequireEligibilityCheck(value); setSaved(false); }}
            />
            <ToggleRow
              label="Auto-assign to Class"
              description="System automatically places student in best available class"
              value={autoAssignClass}
              onChange={(value) => { setAutoAssignClass(value); setSaved(false); }}
            />
            <ToggleRow
              label="Enrollment Requires Approval"
              description="Admin must approve each enrollment"
              value={enrollmentApproval}
              onChange={(value) => { setEnrollmentApproval(value); setSaved(false); }}
            />
            <ToggleRow
              label="Allow Class Transfers"
              description="Students can be transferred between classes"
              value={allowTransfers}
              onChange={(value) => { setAllowTransfers(value); setSaved(false); }}
            />
            <ToggleRow
              label="Re-enrollment Reminder"
              description="Remind guardians when re-enrollment period opens"
              value={reenrollmentReminder}
              onChange={(value) => { setReenrollmentReminder(value); setSaved(false); }}
            />
          </div>
        </>
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={fieldsEditor}
          isCoreField={(tabId, key) => INITIAL_ENROLLMENTS_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
          onStateChange={() => setSaved(false)}
        />
      )}

      <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
        <Button
          type="button"
          onClick={handleSave}
          className={saved ? "bg-success hover:bg-success/90 text-success-foreground ml-auto" : "ml-auto"}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saved ? "Saved!" : "Save Settings"}</span>
        </Button>
      </footer>
    </Card>
  );
}
