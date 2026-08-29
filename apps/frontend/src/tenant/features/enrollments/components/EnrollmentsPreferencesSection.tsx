import React from "react";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { useTranslation } from "@/hooks/useTranslation";
import type { EnrollmentsSettings } from "@mms/shared";

export interface EnrollmentsPreferencesSectionProps {
  settingsDraft: EnrollmentsSettings;
  upd: <K extends keyof EnrollmentsSettings>(field: K, value: EnrollmentsSettings[K]) => void;
}

export function EnrollmentsPreferencesSection({
  settingsDraft,
  upd,
}: EnrollmentsPreferencesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
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
  );
}
