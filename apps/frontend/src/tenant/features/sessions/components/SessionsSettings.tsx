import React, { useMemo, useState } from "react";
import { Save, Calendar } from "lucide-react";
import {
  SESSIONS_TAB_REGISTRY,
  INITIAL_SESSIONS_FIELD_SEED,
  SESSIONS_MODULE_MANIFEST,
  formatMonthName,
  type AppTranslationKey,
} from "@mms/shared";
import { useSessionConfig } from "@/hooks/useStandardModuleConfig";
import { SESSION_TYPES } from "@/lib/data/sessionsData";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { notify } from "@/lib/notify";

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "sessions.setup.fields",
  preferences: "sessions.setup.preferences",
};

export function SessionsSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(SESSIONS_MODULE_MANIFEST);
  const config = useSessionConfig();
  const { types } = config;
  const {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettingsAsync,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: SESSIONS_TAB_REGISTRY,
  });
  const typeOptions = types.length > 0 ? types : [...SESSION_TYPES];

  const settingsSubTabs = useMemo(
    () =>
      SESSIONS_MODULE_MANIFEST.setupSubTabs.map((key, index) => ({
        key,
        label: t(SETUP_TAB_LABEL_KEYS[key]),
        order: index,
      })),
    [t],
  );

  const [sub, setSub] = useState<string>(() => settingsSubTabs[0]?.key || "fields");
  const showFields = sub === "fields";
  const showPrefs = sub === "preferences";

  const handleSave = async (): Promise<void> => {
    try {
      await saveSettingsAsync();
      notify.success(t("sessions.settings.saved"));
    } catch (error) {
      notify.error(t("settings.serverSaveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={settingsSubTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        value={sub}
        onChange={setSub}
      />

      {!canEditSetup ? (
        <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
          {t("sessions.setupReadOnly")}
        </p>
      ) : (
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground">{t("sessions.settings.title")}</h3>
          </div>

          {showPrefs && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={FORM_LABEL} htmlFor="defaultDuration">{t("sessions.settings.defaultDuration")}</label>
                  <Input
                    id="defaultDuration"
                    type="number"
                    value={settingsDraft.defaultDuration || ""}
                    onChange={(event) => upd("defaultDuration", event.target.value)}
                  />
                </div>
                <div>
                  <label className={FORM_LABEL} htmlFor="defaultSessionType">{t("sessions.settings.defaultSessionType")}</label>
                  <FormSelect
                    id="defaultSessionType"
                    value={settingsDraft.defaultSessionType}
                    onChange={(value) => upd("defaultSessionType", value)}
                    options={typeOptions}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className={FORM_LABEL} htmlFor="academicYear">{t("sessions.settings.academicYear")}</label>
                  <Input
                    id="academicYear"
                    type="text"
                    value={settingsDraft.academicYear || ""}
                    onChange={(event) => upd("academicYear", event.target.value)}
                    placeholder={t("sessions.settings.academicYearPlaceholder")}
                  />
                </div>
                <div>
                  <label className={FORM_LABEL} htmlFor="sessionStart">{t("sessions.settings.sessionStart")}</label>
                  <FormSelect
                    id="sessionStart"
                    value={settingsDraft.sessionStart}
                    onChange={(value) => upd("sessionStart", value)}
                    options={["january", "february", "march", "april", "may", "june",
                      "july", "august", "september", "october", "november", "december"].map((month, idx) => ({
                        value: month,
                        label: formatMonthName(new Date(2000, idx, 1)),
                      }))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <ToggleRow
                  label={t("sessions.settings.allowOverlap")}
                  description={t("sessions.settings.allowOverlapHint")}
                  value={settingsDraft.allowOverlap}
                  onChange={(value) => upd("allowOverlap", value)}
                />
                <ToggleRow
                  label={t("sessions.settings.archiveOld")}
                  description={t("sessions.settings.archiveOldHint")}
                  value={settingsDraft.archiveOldSessions}
                  onChange={(value) => upd("archiveOldSessions", value)}
                />
                <ToggleRow
                  label={t("sessions.settings.requireBudget")}
                  description={t("sessions.settings.requireBudgetHint")}
                  value={settingsDraft.requireBudget}
                  onChange={(value) => upd("requireBudget", value)}
                />
                <ToggleRow
                  label={t("sessions.settings.timetableConflict")}
                  description={t("sessions.settings.timetableConflictHint")}
                  value={settingsDraft.timetableConflictCheck}
                  onChange={(value) => upd("timetableConflictCheck", value)}
                />
                <ToggleRow
                  label={t("sessions.settings.notifyOnStart")}
                  description={t("sessions.settings.notifyOnStartHint")}
                  value={settingsDraft.notifyOnSessionStart}
                  onChange={(value) => upd("notifyOnSessionStart", value)}
                />

                <div className="py-3 border-t border-border mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("sessions.settings.defaultViewLayout")}</p>
                    <p className="text-xs text-muted-foreground">{t("sessions.settings.defaultViewLayoutHint")}</p>
                  </div>
                  <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => upd("defaultViewLayout", "list")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                        (settingsDraft.defaultViewLayout || "cards") === "list"
                          ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                      }`}
                    >
                      {t("sessions.settings.listView")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => upd("defaultViewLayout", "cards")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                        (settingsDraft.defaultViewLayout || "cards") === "cards"
                          ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                      }`}
                    >
                      {t("sessions.settings.cardGrid")}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {showFields && (
            <ModuleFieldsSetup
              editor={fieldsEditor}
              isCoreField={(tabId, key) => INITIAL_SESSIONS_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
              onStateChange={() => setSaved(false)}
            />
          )}

          <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
            <Button
              type="button"
              onClick={() => { void handleSave(); }}
              className={saved ? "bg-success hover:bg-success/90 text-success-foreground ms-auto" : "ms-auto"}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saved ? t("settings.savedBadge") : t("common.save")}</span>
            </Button>
          </footer>
        </section>
      )}
    </div>
  );
}
