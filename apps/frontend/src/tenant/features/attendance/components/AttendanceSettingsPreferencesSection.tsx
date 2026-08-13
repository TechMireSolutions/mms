import React from "react";
import { Card } from "@/components/ui/card";
import { CardTitleBar } from "@/components/ui/CardTitleBar";
import { QrCode, Bell, Clock, Scan } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SegmentedPillFilter } from "@/components/ui/SegmentedPillFilter";
import { Badge } from "@/components/ui/badge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { cn } from "@/lib/utils";
import type { AttendanceSettings } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { AttendanceSettingRow } from "@/tenant/features/attendance/components/AttendanceSettingRow";

interface AttendanceSettingsPreferencesSectionProps {
  t: TranslationFunction;
  settingsDraft: AttendanceSettings;
  upd: <K extends keyof AttendanceSettings>(key: K, value: AttendanceSettings[K]) => void;
}

export function AttendanceSettingsPreferencesSection({
  t,
  settingsDraft,
  upd,
}: AttendanceSettingsPreferencesSectionProps): React.JSX.Element {
  return (
    <>
      <Card accentColor="primary" className="p-0 overflow-hidden">
        <CardTitleBar
          headingLevel={2}
          inset
          icon={<Clock className="w-4 h-4 text-primary" />}
          title={t("attendance.settings.timingRules")}
        />
        <div className="px-5 ps-6.5 pb-2">
          <AttendanceSettingRow label={t("attendance.settings.lateThreshold")} sub={t("attendance.settings.lateThresholdDesc")}>
            <div className="flex items-center gap-2">
              <label htmlFor="setting-late-threshold" className="sr-only">{t("attendance.settings.lateThresholdMinutes")}</label>
              <Input
                id="setting-late-threshold"
                name="lateThresholdMins"
                type="number"
                min={1}
                max={60}
                value={settingsDraft.lateThresholdMins || ""}
                onChange={(event) => upd("lateThresholdMins", Number(event.target.value))}
                className="w-16 text-sm text-center"
              />
              <span className="text-xs text-muted-foreground">{t("attendance.settings.minutesShort")}</span>
            </div>
          </AttendanceSettingRow>
          <AttendanceSettingRow label={t("attendance.settings.autoAbsent")} sub={t("attendance.settings.autoAbsentDesc")}>
            <div className="flex items-center gap-2">
              <label htmlFor="setting-auto-absent" className="sr-only">{t("attendance.settings.autoAbsentMinutes")}</label>
              <Input
                id="setting-auto-absent"
                name="autoAbsentAfterMins"
                type="number"
                min={10}
                max={120}
                value={settingsDraft.autoAbsentAfterMins || ""}
                onChange={(event) => upd("autoAbsentAfterMins", Number(event.target.value))}
                className="w-16 text-sm text-center"
              />
              <span className="text-xs text-muted-foreground">{t("attendance.settings.minutesShort")}</span>
            </div>
          </AttendanceSettingRow>
          <AttendanceSettingRow label={t("attendance.settings.lockAfterSubmit")} sub={t("attendance.settings.lockAfterSubmitDesc")}>
            <Switch checked={settingsDraft.lockAfterSubmit} onCheckedChange={(value) => upd("lockAfterSubmit", value)} />
          </AttendanceSettingRow>
        </div>
      </Card>

      <Card accentColor="info" className="p-0 overflow-hidden">
        <CardTitleBar
          headingLevel={2}
          inset
          icon={<QrCode className="w-4 h-4 text-primary" />}
          title={t("attendance.settings.qrAttendance")}
        />
        <div className="px-5 ps-6.5 pb-2">
          <AttendanceSettingRow label={t("attendance.settings.enableQr")} sub={t("attendance.settings.enableQrDesc")}>
            <Switch checked={Boolean(settingsDraft.qrEnabled)} onCheckedChange={(value) => upd("qrEnabled", value)} />
          </AttendanceSettingRow>
        </div>
      </Card>

      <Card accentColor="warning" className="p-0 overflow-hidden">
        <CardTitleBar
          headingLevel={2}
          inset
          icon={<Bell className="w-4 h-4 text-primary" />}
          title={t("attendance.settings.alerts")}
        />
        <div className="px-5 ps-6.5 pb-2">
          <AttendanceSettingRow label={t("attendance.settings.lowThreshold")} sub={t("attendance.settings.lowThresholdDesc")}>
            <div className="flex items-center gap-2">
              <label htmlFor="setting-low-attendance" className="sr-only">{t("attendance.settings.lowThresholdPercent")}</label>
              <Input
                id="setting-low-attendance"
                name="lowAttendanceThreshold"
                type="number"
                min={50}
                max={100}
                value={(settingsDraft.lowAttendanceThreshold as number | undefined) || ""}
                onChange={(event) => upd("lowAttendanceThreshold", Number(event.target.value))}
                className="w-16 text-sm text-center"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </AttendanceSettingRow>
          <AttendanceSettingRow label={t("attendance.settings.notifyParents")} sub={t("attendance.settings.notifyParentsDesc")}>
            <Switch checked={Boolean(settingsDraft.notifyParents)} onCheckedChange={(value) => upd("notifyParents", value)} />
          </AttendanceSettingRow>
          <AttendanceSettingRow label={t("attendance.settings.requireAbsentNote")} sub={t("attendance.settings.requireAbsentNoteDesc")}>
            <Switch checked={Boolean(settingsDraft.requireNoteForAbsent)} onCheckedChange={(value) => upd("requireNoteForAbsent", value)} />
          </AttendanceSettingRow>
        </div>
      </Card>

      <Card accentColor="success" className="p-0 overflow-hidden">
        <CardTitleBar
          headingLevel={2}
          inset
          icon={<Scan className="w-4 h-4 text-primary" />}
          title={t("attendance.settings.advanced")}
        />
        <div className="px-5 ps-6.5 pb-2">
          <AttendanceSettingRow label={t("attendance.settings.offlineMode")} sub={t("attendance.settings.offlineModeDesc")}>
            <Switch checked={Boolean(settingsDraft.offlineEnabled)} onCheckedChange={(value) => upd("offlineEnabled", value)} />
          </AttendanceSettingRow>
          <AttendanceSettingRow label={t("attendance.settings.geoTagging")} sub={t("attendance.settings.geoTaggingDesc")}>
            <Switch checked={Boolean(settingsDraft.geoTagging)} onCheckedChange={(value) => upd("geoTagging", value)} />
          </AttendanceSettingRow>
          <AttendanceSettingRow label={t("attendance.settings.defaultLayout")} sub={t("attendance.settings.defaultLayoutDesc")}>
            <SegmentedPillFilter
              size="sm"
              value={((settingsDraft.defaultViewLayout as string | undefined) || "list") as "list" | "cards"}
              onChange={(value) => upd("defaultViewLayout", value)}
              options={[
                { value: "list", label: t("attendance.settings.listView") },
                { value: "cards", label: t("attendance.settings.cardGrid") },
              ]}
            />
          </AttendanceSettingRow>
          <AttendanceSettingRow label={t("attendance.settings.facialRecognition")} sub={t("attendance.settings.facialRecognitionDesc")}>
            <Badge pill variant="outline" className={cn("px-2 font-bold", SEMANTIC_BADGE.warningStrong)}>{t("attendance.settings.comingSoon")}</Badge>
          </AttendanceSettingRow>
          <AttendanceSettingRow label={t("attendance.settings.dailyAutoLock")} sub={t("attendance.settings.dailyAutoLockDesc")}>
            <Switch checked={settingsDraft.lockAfterSubmit} onCheckedChange={(value) => upd("lockAfterSubmit", value)} />
          </AttendanceSettingRow>
          <AttendanceSettingRow label={t("attendance.settings.auditLogging")} sub={t("attendance.settings.auditLoggingDesc")}>
            <Badge pill variant="outline" className={cn("px-2 font-bold", SEMANTIC_BADGE.successStrong)}>{t("attendance.settings.active")}</Badge>
          </AttendanceSettingRow>
        </div>
      </Card>
    </>
  );
}
