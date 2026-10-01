import React from "react";
import { QrCode, Bell, Scan } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SegmentedPillFilter } from "@/components/ui/SegmentedPillFilter";
import { Badge } from "@/components/ui/badge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { cn } from "@/lib/utils";
import type { AttendanceSettings } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { SectionCard } from "@/components/ui/SectionCard";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { AttendanceTimingRulesSection } from "./AttendanceTimingRulesSection";

export interface AttendanceSettingsPreferencesSectionProps {
  settingsDraft: AttendanceSettings;
  upd: <K extends keyof AttendanceSettings>(key: K, value: AttendanceSettings[K]) => void;
}

export function AttendanceSettingsPreferencesSection({
  settingsDraft,
  upd,
}: AttendanceSettingsPreferencesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <AttendanceTimingRulesSection settingsDraft={settingsDraft} upd={upd} t={t} />

      <SectionCard
        accentColor="info"
        icon={QrCode}
        title={t("attendance.settings.qrAttendance")}
        className={SETUP_SECTION_CARD_CLASS}
      >
        <ToggleRow
          label={t("attendance.settings.enableQr")}
          description={t("attendance.settings.enableQrDesc")}
          value={Boolean(settingsDraft.qrEnabled)}
          onChange={(value) => upd("qrEnabled", value)}
        />
      </SectionCard>

      <SectionCard
        accentColor="warning"
        icon={Bell}
        title={t("attendance.settings.alerts")}
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="space-y-4">
          <Field
            id="setting-low-attendance"
            label={t("attendance.settings.lowThreshold")}
            hint={t("attendance.settings.lowThresholdDesc")}
          >
            <div className="flex items-center gap-2">
              <Input
                id="setting-low-attendance"
                name="lowAttendanceThreshold"
                type="text"
                inputMode="numeric"
                min={50}
                max={100}
                value={(settingsDraft.lowAttendanceThreshold as number | undefined) || ""}
                onChange={(event) => upd("lowAttendanceThreshold", Number(event.target.value))}
                className={cn(FORM_INPUT, "w-24 text-center")}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </Field>

          <div className="space-y-2 pt-1 border-t border-border/60">
            <ToggleRow
              label={t("attendance.settings.notifyParents")}
              description={t("attendance.settings.notifyParentsDesc")}
              value={Boolean(settingsDraft.notifyParents)}
              onChange={(value) => upd("notifyParents", value)}
            />
            <ToggleRow
              label={t("attendance.settings.requireAbsentNote")}
              description={t("attendance.settings.requireAbsentNoteDesc")}
              value={Boolean(settingsDraft.requireNoteForAbsent)}
              onChange={(value) => upd("requireNoteForAbsent", value)}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        accentColor="success"
        icon={Scan}
        title={t("attendance.settings.advanced")}
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="space-y-3">
          <ToggleRow
            label={t("attendance.settings.offlineMode")}
            description={t("attendance.settings.offlineModeDesc")}
            value={Boolean(settingsDraft.offlineEnabled)}
            onChange={(value) => upd("offlineEnabled", value)}
          />
          <ToggleRow
            label={t("attendance.settings.geoTagging")}
            description={t("attendance.settings.geoTaggingDesc")}
            value={Boolean(settingsDraft.geoTagging)}
            onChange={(value) => upd("geoTagging", value)}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold text-foreground">
                {t("attendance.settings.defaultLayout")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("attendance.settings.defaultLayoutDesc")}
              </p>
            </div>
            <SegmentedPillFilter
              size="sm"
              value={((settingsDraft.defaultViewLayout as string | undefined) || "list") as "list" | "cards"}
              onChange={(value) => upd("defaultViewLayout", value)}
              options={[
                { value: "list", label: t("attendance.settings.listView") },
                { value: "cards", label: t("attendance.settings.cardGrid") },
              ]}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold text-foreground">
                {t("attendance.settings.facialRecognition")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("attendance.settings.facialRecognitionDesc")}
              </p>
            </div>
            <Badge pill variant="outline" className={cn("px-2 font-bold", SEMANTIC_BADGE.warningStrong)}>
              {t("attendance.settings.comingSoon")}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold text-foreground">
                {t("attendance.settings.auditLogging")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("attendance.settings.auditLoggingDesc")}
              </p>
            </div>
            <Badge pill variant="outline" className={cn("px-2 font-bold", SEMANTIC_BADGE.successStrong)}>
              {t("attendance.settings.active")}
            </Badge>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
