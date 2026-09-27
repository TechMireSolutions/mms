import React from "react";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AttendanceSettings } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { SectionCard } from "@/components/ui/SectionCard";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";

export interface AttendanceTimingRulesSectionProps {
  settingsDraft: AttendanceSettings;
  upd: <K extends keyof AttendanceSettings>(key: K, value: AttendanceSettings[K]) => void;
  t: TranslationFunction;
}

export function AttendanceTimingRulesSection({
  settingsDraft,
  upd,
  t,
}: AttendanceTimingRulesSectionProps): React.JSX.Element {
  return (
    <SectionCard
      accentColor="primary"
      icon={Clock}
      title={t("attendance.settings.timingRules")}
      className={SETUP_SECTION_CARD_CLASS}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            id="setting-late-threshold"
            label={t("attendance.settings.lateThreshold")}
            hint={t("attendance.settings.lateThresholdDesc")}
          >
            <div className="flex items-center gap-2">
              <Input
                id="setting-late-threshold"
                name="lateThresholdMins"
                type="number"
                inputMode="numeric"
                min={1}
                max={60}
                value={settingsDraft.lateThresholdMins || ""}
                onChange={(event) => upd("lateThresholdMins", Number(event.target.value))}
                className={cn(FORM_INPUT, "w-24 text-center")}
              />
              <span className="text-xs text-muted-foreground">{t("attendance.settings.minutesShort")}</span>
            </div>
          </Field>

          <Field
            id="setting-auto-absent"
            label={t("attendance.settings.autoAbsent")}
            hint={t("attendance.settings.autoAbsentDesc")}
          >
            <div className="flex items-center gap-2">
              <Input
                id="setting-auto-absent"
                name="autoAbsentAfterMins"
                type="number"
                inputMode="numeric"
                min={10}
                max={120}
                value={settingsDraft.autoAbsentAfterMins || ""}
                onChange={(event) => upd("autoAbsentAfterMins", Number(event.target.value))}
                className={cn(FORM_INPUT, "w-24 text-center")}
              />
              <span className="text-xs text-muted-foreground">{t("attendance.settings.minutesShort")}</span>
            </div>
          </Field>
        </div>

        <div className="pt-1 border-t border-border/60">
          <ToggleRow
            label={t("attendance.settings.lockAfterSubmit")}
            description={t("attendance.settings.lockAfterSubmitDesc")}
            value={Boolean(settingsDraft.lockAfterSubmit)}
            onChange={(value) => upd("lockAfterSubmit", value)}
          />
        </div>
      </div>
    </SectionCard>
  );
}
