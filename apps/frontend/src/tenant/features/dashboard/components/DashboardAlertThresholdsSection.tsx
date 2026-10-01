import React from "react";
import { CustomizeSectionCard } from "@/tenant/features/dashboard/components/CustomizeSectionCard";
import { Field } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export interface DashboardAlertThresholdsSectionProps {
  lowAttendanceThreshold?: number;
  urgentAttendanceThreshold?: number;
  onUpdateThreshold: (key: "lowAttendanceThreshold" | "urgentAttendanceThreshold", value: number) => void;
  hasGridMode: boolean;
  t: TranslationFunction;
}

export function DashboardAlertThresholdsSection({
  lowAttendanceThreshold,
  urgentAttendanceThreshold,
  onUpdateThreshold,
  hasGridMode,
  t,
}: DashboardAlertThresholdsSectionProps): React.JSX.Element {
  return (
    <div className={hasGridMode ? "md:col-span-1" : "md:col-span-2"}>
      <CustomizeSectionCard
        title={t("dashboard.alertSettings")}
        description={t("dashboard.alertSettingsDesc")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <Field id="pref-low-att" label={t("dashboard.lowAttendanceThresholdLabel")}>
            <Input
              id="pref-low-att"
              name="lowAttendanceThreshold"
              type="text"
              inputMode="numeric"
              value={lowAttendanceThreshold ?? 75}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 100) {
                  onUpdateThreshold("lowAttendanceThreshold", val);
                }
              }}
              className="min-h-11 text-sm"
            />
          </Field>
          <Field id="pref-urgent-att" label={t("dashboard.urgentAttendanceThresholdLabel")}>
            <Input
              id="pref-urgent-att"
              name="urgentAttendanceThreshold"
              type="text"
              inputMode="numeric"
              value={urgentAttendanceThreshold ?? 60}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 100) {
                  onUpdateThreshold("urgentAttendanceThreshold", val);
                }
              }}
              className="min-h-11 text-sm"
            />
          </Field>
        </div>
      </CustomizeSectionCard>
    </div>
  );
}
