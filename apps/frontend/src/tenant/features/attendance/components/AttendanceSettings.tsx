import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Save, QrCode, Bell, Clock, Scan } from "lucide-react";
import {
  ATTENDANCE_TAB_REGISTRY,
  ATTENDANCE_MODULE_MANIFEST,
  INITIAL_ATTENDANCE_FIELD_SEED,
  type AppTranslationKey,
} from "@mms/shared";
import { useAttendanceConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { notify } from "@/lib/notify";

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "attendance.setup.fields",
  preferences: "attendance.setup.preferences",
};

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

export function AttendanceSettings() {
  const { canEditSetup } = useModulePermissions(ATTENDANCE_MODULE_MANIFEST);
  const { t } = useTranslation();
  const config = useAttendanceConfig();
  const {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettingsAsync,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: ATTENDANCE_TAB_REGISTRY,
  });

  const settingsSubTabs = useMemo(
    () => ATTENDANCE_MODULE_MANIFEST.setupSubTabs.map((key) => ({
      key,
      label: t(SETUP_TAB_LABEL_KEYS[key]),
    })),
    [t],
  );
  const [sub, setSub] = useState<string>(() => settingsSubTabs[0]?.key ?? "fields");

  const handleSave = async () => {
    try {
      await saveSettingsAsync();
      notify.success(t("attendance.settings.saved"));
    } catch (error) {
      notify.error(t("settings.serverSaveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const showPrefs = sub === "preferences";
  const showFields = sub === "fields";

  return (
    <section className="max-w-2xl space-y-6">
      <SubTabBar tabs={settingsSubTabs} value={sub} onChange={setSub} />
      {!canEditSetup ? (
        <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
          {t("attendance.settings.readOnly")}
        </p>
      ) : (
      <>
      {showPrefs && (
        <>
          {/* Timing */}
          <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md border-border/80">
            <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2 ps-6.5">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground m-0">{t("attendance.settings.timingRules")}</h2>
            </header>
            <div className="px-4 ps-6.5 pb-2">
              <SettingRow label={t("attendance.settings.lateThreshold")} sub={t("attendance.settings.lateThresholdDesc")}>
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
              </SettingRow>
              <SettingRow label={t("attendance.settings.autoAbsent")} sub={t("attendance.settings.autoAbsentDesc")}>
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
              </SettingRow>
              <SettingRow label={t("attendance.settings.lockAfterSubmit")} sub={t("attendance.settings.lockAfterSubmitDesc")}>
                <Switch checked={settingsDraft.lockAfterSubmit} onCheckedChange={(value) => upd("lockAfterSubmit", value)} />
              </SettingRow>
            </div>
          </Card>

          {/* QR */}
          <Card accentColor="info" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md border-border/80">
            <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2 ps-6.5">
              <QrCode className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground m-0">{t("attendance.settings.qrAttendance")}</h2>
            </header>
            <div className="px-4 ps-6.5 pb-2">
              <SettingRow label={t("attendance.settings.enableQr")} sub={t("attendance.settings.enableQrDesc")}>
                <Switch checked={settingsDraft.qrEnabled} onCheckedChange={(value) => upd("qrEnabled", value)} />
              </SettingRow>
            </div>
          </Card>

          {/* Alerts */}
          <Card accentColor="warning" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md border-border/80">
            <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2 ps-6.5">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground m-0">{t("attendance.settings.alerts")}</h2>
            </header>
            <div className="px-4 ps-6.5 pb-2">
              <SettingRow label={t("attendance.settings.lowThreshold")} sub={t("attendance.settings.lowThresholdDesc")}>
                <div className="flex items-center gap-2">
                  <label htmlFor="setting-low-attendance" className="sr-only">{t("attendance.settings.lowThresholdPercent")}</label>
                  <Input 
                    id="setting-low-attendance"
                    name="lowAttendanceThreshold"
                    type="number" 
                    min={50} 
                    max={100} 
                    value={settingsDraft.lowAttendanceThreshold || ""}
                    onChange={(event) => upd("lowAttendanceThreshold", Number(event.target.value))}
                    className="w-16 text-sm text-center" 
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </SettingRow>
              <SettingRow label={t("attendance.settings.notifyParents")} sub={t("attendance.settings.notifyParentsDesc")}>
                <Switch checked={settingsDraft.notifyParents} onCheckedChange={(value) => upd("notifyParents", value)} />
              </SettingRow>
              <SettingRow label={t("attendance.settings.requireAbsentNote")} sub={t("attendance.settings.requireAbsentNoteDesc")}>
                <Switch checked={settingsDraft.requireNoteForAbsent} onCheckedChange={(value) => upd("requireNoteForAbsent", value)} />
              </SettingRow>
            </div>
          </Card>

          {/* Advanced Features */}
          <Card accentColor="success" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md border-border/80">
            <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2 pl-6.5">
              <Scan className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground m-0">{t("attendance.settings.advanced")}</h2>
            </header>
            <div className="px-4 pl-6.5 pb-2">
              <SettingRow label={t("attendance.settings.offlineMode")} sub={t("attendance.settings.offlineModeDesc")}>
                <Switch checked={settingsDraft.offlineEnabled} onCheckedChange={(value) => upd("offlineEnabled", value)} />
              </SettingRow>
              <SettingRow label={t("attendance.settings.geoTagging")} sub={t("attendance.settings.geoTaggingDesc")}>
                <Switch checked={settingsDraft.geoTagging} onCheckedChange={(value) => upd("geoTagging", value)} />
              </SettingRow>
              <SettingRow label={t("attendance.settings.defaultLayout")} sub={t("attendance.settings.defaultLayoutDesc")}>
                <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
                  <Button
                    type="button"
                    variant={(settingsDraft.defaultViewLayout || "list") === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => upd("defaultViewLayout", "list")}
                    className="text-xs font-semibold rounded-lg px-3 shadow-none bg-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
                    data-state={(settingsDraft.defaultViewLayout || "list") === "list" ? "active" : "inactive"}
                  >
                    {t("attendance.settings.listView")}
                  </Button>
                  <Button
                    type="button"
                    variant={settingsDraft.defaultViewLayout === "cards" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => upd("defaultViewLayout", "cards")}
                    className="text-xs font-semibold rounded-lg px-3 shadow-none bg-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
                    data-state={settingsDraft.defaultViewLayout === "cards" ? "active" : "inactive"}
                  >
                    {t("attendance.settings.cardGrid")}
                  </Button>
                </div>
              </SettingRow>
              <SettingRow label={t("attendance.settings.facialRecognition")} sub={t("attendance.settings.facialRecognitionDesc")}>
                <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", SEMANTIC_BADGE.warningStrong)}>{t("attendance.settings.comingSoon")}</span>
              </SettingRow>
              <SettingRow label={t("attendance.settings.dailyAutoLock")} sub={t("attendance.settings.dailyAutoLockDesc")}>
                <Switch checked={settingsDraft.lockAfterSubmit} onCheckedChange={(value) => upd("lockAfterSubmit", value)} />
              </SettingRow>
              <SettingRow label={t("attendance.settings.auditLogging")} sub={t("attendance.settings.auditLoggingDesc")}>
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
          onClick={() => void handleSave()}
          className={cn("ms-auto", saved && "bg-success hover:bg-success/90 text-success-foreground")}
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? t("settings.savedBadge") : t("common.save")}
        </Button>
      </footer>
      </>
      )}
    </section>
  );
}
