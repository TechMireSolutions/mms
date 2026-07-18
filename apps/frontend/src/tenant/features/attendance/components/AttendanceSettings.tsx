import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Save, QrCode, Bell, Clock, Shield, Scan } from "lucide-react";
import {
  ATTENDANCE_TAB_REGISTRY,
  INITIAL_ATTENDANCE_FIELD_SEED,
} from "@mms/shared";
import { useAttendanceConfig } from "@/tenant/features/attendance/hooks/useAttendanceConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { useIsAdminViewer } from "@/tenant/hooks/useViewerRole";

interface AttendanceSettingsProps {
  mode?: "fields" | "preferences";
}

interface SettingRowProps {
  label: string;
  sub?: string;
  children: React.ReactNode;
}

function SettingRow({ label, sub, children }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground m-0">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export function AttendanceSettings({ mode }: AttendanceSettingsProps) {
  const isAdmin = useIsAdminViewer();
  const { t } = useTranslation();
  const config = useAttendanceConfig();
  const {
    settings,
    fieldsEditor,
    saved,
    setSaved,
    saveSettings,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: ATTENDANCE_TAB_REGISTRY,
  });

  // Prefs state
  const [workingDays, setWorkingDays] = useState(settings.workingDays);
  const [cutoffTime, setCutoffTime] = useState(settings.cutoffTime);
  const [lateThresholdMins, setLateThresholdMins] = useState(settings.lateThresholdMins);
  const [autoAbsentAfterMins, setAutoAbsentAfterMins] = useState(settings.autoAbsentAfterMins);
  const [qrEnabled, setQrEnabled] = useState(settings.qrEnabled);
  const [lowAttendanceThreshold, setLowAttendanceThreshold] = useState(settings.lowAttendanceThreshold);
  const [notifyParents, setNotifyParents] = useState(settings.notifyParents);
  const [requireNoteForAbsent, setRequireNoteForAbsent] = useState(settings.requireNoteForAbsent);
  const [lockAfterSubmit, setLockAfterSubmit] = useState(settings.lockAfterSubmit);
  const [trackHalfDay, setTrackHalfDay] = useState(settings.trackHalfDay);
  const [weeklyReport, setWeeklyReport] = useState(settings.weeklyReport);
  const [attendanceAlerts, setAttendanceAlerts] = useState(settings.attendanceAlerts);
  const [allowManualOverride, setAllowManualOverride] = useState(settings.allowManualOverride);
  const [offlineEnabled, setOfflineEnabled] = useState(settings.offlineEnabled);
  const [geoTagging, setGeoTagging] = useState(settings.geoTagging);
  const [defaultViewLayout, setDefaultViewLayout] = useState(settings.defaultViewLayout);

  useEffect(() => {
    if (!settings) return;
    setWorkingDays(settings.workingDays);
    setCutoffTime(settings.cutoffTime);
    setLateThresholdMins(settings.lateThresholdMins);
    setAutoAbsentAfterMins(settings.autoAbsentAfterMins);
    setQrEnabled(settings.qrEnabled);
    setLowAttendanceThreshold(settings.lowAttendanceThreshold);
    setNotifyParents(settings.notifyParents);
    setRequireNoteForAbsent(settings.requireNoteForAbsent);
    setLockAfterSubmit(settings.lockAfterSubmit);
    setTrackHalfDay(settings.trackHalfDay);
    setWeeklyReport(settings.weeklyReport);
    setAttendanceAlerts(settings.attendanceAlerts);
    setAllowManualOverride(settings.allowManualOverride);
    setOfflineEnabled(settings.offlineEnabled);
    setGeoTagging(settings.geoTagging);
    setDefaultViewLayout(settings.defaultViewLayout);
  }, [settings]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-base font-semibold text-foreground">Admin Access Required</p>
        <p className="text-sm text-muted-foreground mt-1">Only administrators can configure attendance settings.</p>
      </div>
    );
  }

  const handleSave = () => {
    saveSettings({
      workingDays,
      cutoffTime,
      lateThresholdMins,
      autoAbsentAfterMins,
      qrEnabled,
      lowAttendanceThreshold,
      notifyParents,
      requireNoteForAbsent,
      lockAfterSubmit,
      trackHalfDay,
      weeklyReport,
      attendanceAlerts,
      allowManualOverride,
      offlineEnabled,
      geoTagging,
      defaultViewLayout,
    });
  };

  const showPrefs = mode === "preferences";
  const showFields = mode === "fields";

  return (
    <section className="max-w-2xl space-y-6">
      {showPrefs && (
        <>
          {/* Timing */}
          <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md border-border/80">
            <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2 pl-6.5">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground m-0">Timing Rules</h2>
            </header>
            <div className="px-4 pl-6.5 pb-2">
              <SettingRow label="Late Threshold" sub="Students arriving after this many minutes are marked Late">
                <div className="flex items-center gap-2">
                  <label htmlFor="setting-late-threshold" className="sr-only">Late Threshold Minutes</label>
                  <input 
                    id="setting-late-threshold"
                    type="number" 
                    min={1} 
                    max={60} 
                    value={lateThresholdMins}
                    onChange={(event) => { setLateThresholdMins(Number(event.target.value)); setSaved(false); }}
                    className="w-16 text-sm text-center rounded-lg border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </SettingRow>
              <SettingRow label="Auto-Absent After" sub="Mark student absent if not arrived after this threshold">
                <div className="flex items-center gap-2">
                  <label htmlFor="setting-auto-absent" className="sr-only">Auto Absent Minutes</label>
                  <input 
                    id="setting-auto-absent"
                    type="number" 
                    min={10} 
                    max={120} 
                    value={autoAbsentAfterMins}
                    onChange={(event) => { setAutoAbsentAfterMins(Number(event.target.value)); setSaved(false); }}
                    className="w-16 text-sm text-center rounded-lg border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </SettingRow>
              <SettingRow label="Lock After Submit" sub="Prevent edits once attendance is submitted">
                <Switch checked={lockAfterSubmit} onCheckedChange={(value) => { setLockAfterSubmit(value); setSaved(false); }} />
              </SettingRow>
            </div>
          </Card>

          {/* QR */}
          <Card accentColor="indigo" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md border-border/80">
            <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2 pl-6.5">
              <QrCode className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground m-0">QR Attendance</h2>
            </header>
            <div className="px-4 pl-6.5 pb-2">
              <SettingRow label="Enable QR Attendance" sub="Allow teachers to scan student QR codes to mark attendance">
                <Switch checked={qrEnabled} onCheckedChange={(value) => { setQrEnabled(value); setSaved(false); }} />
              </SettingRow>
            </div>
          </Card>

          {/* Alerts */}
          <Card accentColor="warning" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md border-border/80">
            <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2 pl-6.5">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground m-0">Alerts & Notifications</h2>
            </header>
            <div className="px-4 pl-6.5 pb-2">
              <SettingRow label="Low Attendance Threshold" sub="Trigger alert when student attendance drops below this %">
                <div className="flex items-center gap-2">
                  <label htmlFor="setting-low-attendance" className="sr-only">Low Attendance Threshold Percentage</label>
                  <input 
                    id="setting-low-attendance"
                    type="number" 
                    min={50} 
                    max={100} 
                    value={lowAttendanceThreshold}
                    onChange={(event) => { setLowAttendanceThreshold(Number(event.target.value)); setSaved(false); }}
                    className="w-16 text-sm text-center rounded-lg border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </SettingRow>
              <SettingRow label="Notify Parents" sub="Send SMS/WhatsApp to parent on student absence">
                <Switch checked={notifyParents} onCheckedChange={(value) => { setNotifyParents(value); setSaved(false); }} />
              </SettingRow>
              <SettingRow label="Require Note for Absent" sub="Teacher must add a note when marking a student absent">
                <Switch checked={requireNoteForAbsent} onCheckedChange={(value) => { setRequireNoteForAbsent(value); setSaved(false); }} />
              </SettingRow>
            </div>
          </Card>

          {/* Advanced Features */}
          <Card accentColor="success" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md border-border/80">
            <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2 pl-6.5">
              <Scan className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground m-0">Advanced Features</h2>
            </header>
            <div className="px-4 pl-6.5 pb-2">
              <SettingRow label="Offline Mode" sub="Allow teachers to mark attendance without internet; syncs when reconnected">
                <Switch checked={offlineEnabled} onCheckedChange={(value) => { setOfflineEnabled(value); setSaved(false); }} />
              </SettingRow>
              <SettingRow label="Geo-location Tagging" sub="Record teacher's GPS coordinates when submitting attendance">
                <Switch checked={geoTagging} onCheckedChange={(value) => { setGeoTagging(value); setSaved(false); }} />
              </SettingRow>
              <SettingRow label="Default View Layout" sub="Select default layout format for attendance records in work view">
                <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
                  <Button
                    type="button"
                    variant={(defaultViewLayout || "list") === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => { setDefaultViewLayout("list"); setSaved(false); }}
                    className="h-7 text-xs font-semibold rounded-lg px-3 shadow-none bg-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
                    data-state={(defaultViewLayout || "list") === "list" ? "active" : "inactive"}
                  >
                    List View
                  </Button>
                  <Button
                    type="button"
                    variant={defaultViewLayout === "cards" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => { setDefaultViewLayout("cards"); setSaved(false); }}
                    className="h-7 text-xs font-semibold rounded-lg px-3 shadow-none bg-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
                    data-state={defaultViewLayout === "cards" ? "active" : "inactive"}
                  >
                    Card Grid
                  </Button>
                </div>
              </SettingRow>
              <SettingRow label="Facial Recognition" sub="AI-powered face scan for attendance (coming soon)">
                <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", SEMANTIC_BADGE.warningStrong)}>{t("attendance.settings.comingSoon")}</span>
              </SettingRow>
              <SettingRow label="Daily Auto-Lock" sub="Automatically lock attendance after end-of-day submission">
                <Switch checked={lockAfterSubmit} onCheckedChange={(value) => { setLockAfterSubmit(value); setSaved(false); }} />
              </SettingRow>
              <SettingRow label="Audit Logging" sub="Record all edits and submissions in an audit trail (always on)">
                <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", SEMANTIC_BADGE.successStrong)}>{t("attendance.settings.active")}</span>
              </SettingRow>
            </div>
          </Card>
        </>
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={fieldsEditor}
          isCoreField={(tabId, key) => INITIAL_ATTENDANCE_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
          onStateChange={() => setSaved(false)}
        />
      )}

      {/* Actions */}
      <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
        <Button
          onClick={handleSave}
          className={cn("ml-auto", saved && "bg-success hover:bg-success/90 text-success-foreground")}
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? "Saved!" : "Save Settings"}
        </Button>
      </footer>
    </section>
  );
}
