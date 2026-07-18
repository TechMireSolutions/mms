import React from "react";
import { Card } from "@/components/ui/card";
import { Save, ClipboardList } from "lucide-react";
import { useEnrollmentConfig } from "@/hooks/useStandardModuleConfig";
import {
  ENROLLMENTS_TAB_REGISTRY,
  INITIAL_ENROLLMENTS_FIELD_SEED,
} from "@mms/shared";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";

interface EnrollmentsSettingsProps {
  mode?: "fields" | "preferences";
}

export function EnrollmentsSettings({ mode }: EnrollmentsSettingsProps): React.JSX.Element {
  const config = useEnrollmentConfig();
  const {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettings,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: ENROLLMENTS_TAB_REGISTRY,
  });

  const handleSave = (): void => {
    saveSettings();
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
                value={settingsDraft.maxStudentsPerClass || ""}
                onChange={(event) => upd("maxStudentsPerClass", event.target.value)}
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="dropDeadlineDays">Drop Deadline (days after enroll)</label>
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
              label="Enable Waitlist"
              description="Allow students to join a waitlist when class is full"
              value={settingsDraft.waitlistEnabled}
              onChange={(value) => upd("waitlistEnabled", value)}
            />
            <ToggleRow
              label="Require Eligibility Check"
              description="Run eligibility rules before confirming enrollment"
              value={settingsDraft.requireEligibilityCheck}
              onChange={(value) => upd("requireEligibilityCheck", value)}
            />
            <ToggleRow
              label="Auto-assign to Class"
              description="System automatically places student in best available class"
              value={settingsDraft.autoAssignClass}
              onChange={(value) => upd("autoAssignClass", value)}
            />
            <ToggleRow
              label="Enrollment Requires Approval"
              description="Admin must approve each enrollment"
              value={settingsDraft.enrollmentApproval}
              onChange={(value) => upd("enrollmentApproval", value)}
            />
            <ToggleRow
              label="Allow Class Transfers"
              description="Students can be transferred between classes"
              value={settingsDraft.allowTransfers}
              onChange={(value) => upd("allowTransfers", value)}
            />
            <ToggleRow
              label="Re-enrollment Reminder"
              description="Remind guardians when re-enrollment period opens"
              value={settingsDraft.reenrollmentReminder}
              onChange={(value) => upd("reenrollmentReminder", value)}
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
