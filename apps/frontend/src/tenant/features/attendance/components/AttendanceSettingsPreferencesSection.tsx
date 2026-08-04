import React from "react";
import { Card } from "@/components/ui/card";
import { QrCode, Bell, Clock, Scan } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SegmentedPillFilter } from "@/components/ui/SegmentedPillFilter";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { cn } from "@/lib/utils";
import type { AttendanceModuleSettings } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { AttendanceSettingRow } from "@/tenant/features/attendance/components/AttendanceSettingRow";

interface AttendanceSettingsPreferencesSectionProps {
  t: TranslationFunction;
  settingsDraft: AttendanceModuleSettings;
  upd: <K extends keyof AttendanceModuleSettings>(key: K, value: AttendanceModuleSettings[K]) => void;
}

export function AttendanceSettingsPreferencesSection({
  t,
  settingsDraft,
  upd,
}: AttendanceSettingsPreferencesSectionProps): React.JSX.Element {
  return (
    <>
      <Card accentColor="primary" className="p-0 overflow-hidden">
        <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2 ps-6.5">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground m-0">{t("attendance.settings.timingRules")}</h2>
        </header>
        <div className="px-4 ps-6.5 pb-2">
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
        <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2 ps-6.5">
          <QrCode className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground m-0">{t("attendance.settings.qrAttendance")}</h2>
        </header>
        <div className="px-4 ps-6.5 pb-2">
          <AttendanceSettingRow label={t("attendance.settings.enableQr")} sub={t("attendance.settings.enableQrDesc")}>
            <Switch checked={Boolean(settingsDraft.qrEnabled)} onCheckedChange={(value) => upd("qrEnabled", value)} />
          </AttendanceSettingRow>
        </div>
      </Card>

      <Card accentColor="warning" className="p-0 overflow-hidden">
        <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2 ps-6.5">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground m-0">{t("attendance.settings.alerts")}</h2>
        </header>
        <div className="px-4 ps-6.5 pb-2">
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
        <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2 ps-6.5">
          <Scan className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground m-0">{t("attendance.settings.advanced")}</h2>
        </header>
        <div className="px-4 ps-6.5 pb-2">
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
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", SEMANTIC_BADGE.warningStrong)}>{t("attendance.settings.comingSoon")}</span>
          </AttendanceSettingRow>
          <AttendanceSettingRow label={t("attendance.settings.dailyAutoLock")} sub={t("attendance.settings.dailyAutoLockDesc")}>
            <Switch checked={settingsDraft.lockAfterSubmit} onCheckedChange={(value) => upd("lockAfterSubmit", value)} />
          </AttendanceSettingRow>
          <AttendanceSettingRow label={t("attendance.settings.auditLogging")} sub={t("attendance.settings.auditLoggingDesc")}>
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", SEMANTIC_BADGE.successStrong)}>{t("attendance.settings.active")}</span>
          </AttendanceSettingRow>
        </div>
      </Card>
    </>
  );
}
