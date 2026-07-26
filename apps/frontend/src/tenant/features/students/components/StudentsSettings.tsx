import React, { useMemo, useState } from "react";
import {
  STUDENT_TAB_REGISTRY,
  DEFAULT_STUDENT_ENABLED_TABS,
  DEFAULT_STUDENT_REQUIRED_TABS,
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  INITIAL_STUDENT_FIELD_SEED,
  STUDENTS_MODULE_CONTRACT,
  type AppTranslationKey,
} from "@mms/shared";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { Save, GraduationCap } from "lucide-react";

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "students.setup.fields",
  preferences: "students.setup.preferences",
};

export default function StudentsSettings(): React.ReactElement {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(STUDENTS_MODULE_CONTRACT);
  const config = useStudentConfig();
  const {
    settings,
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettings,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: STUDENT_TAB_REGISTRY,
    defaultEnabledTabs: DEFAULT_STUDENT_ENABLED_TABS,
    defaultRequiredTabs: DEFAULT_STUDENT_REQUIRED_TABS,
  });

  const settingsSubTabs = useMemo(
    () =>
      STUDENTS_MODULE_CONTRACT.setupSubTabs.map((key, index) => ({
        key,
        label: t(SETUP_TAB_LABEL_KEYS[key]),
        order: index,
      })),
    [t],
  );

  const [sub, setSub] = useState<string>(() => settingsSubTabs[0]?.key || "fields");
  const showFields = sub === "fields";
  const showPrefs = sub === "preferences";

  const handleSave = (): void => {
    saveSettings(undefined, {
      version: 2,
      columnRegistry: settings.columnRegistry || DEFAULT_STUDENT_COLUMN_REGISTRY,
    });
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
          {t("students.setupReadOnly")}
        </p>
      ) : (
        <section className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-5 shadow-sm" aria-labelledby="students-settings-title">
          <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            </div>
            <h3 id="students-settings-title" className="text-[13px] font-bold text-foreground">
              {t("students.settings.title")}
            </h3>
          </div>

          {showPrefs && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                  {t("students.settings.grSectionTitle")}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <Field
                    label={t("students.settings.grTemplate")}
                    hint={t("students.settings.grTemplateHint", { seq: "{seq}", year: "{year}" })}
                  >
                    <Input
                      id="gr-template"
                      className={FORM_INPUT}
                      value={settingsDraft.grNumberTemplate || ""}
                      onChange={(event) => upd("grNumberTemplate", event.target.value)}
                      placeholder={t("students.settings.grTemplatePlaceholder", { seq: "{seq}", year: "{year}" })}
                    />
                  </Field>
                  <Field
                    label={t("students.settings.grDigits")}
                    hint={t("students.settings.grDigitsHint")}
                  >
                    <Input
                      id="gr-digits"
                      type="number"
                      min="1"
                      max="8"
                      className={FORM_INPUT}
                      value={settingsDraft.grNumberDigits || 4}
                      onChange={(event) => upd("grNumberDigits", Number(event.target.value))}
                    />
                  </Field>
                </div>
                <ToggleRow
                  label={t("students.settings.restartAnnually")}
                  description={t("students.settings.restartAnnuallyDesc")}
                  value={settingsDraft.grNumberRestartAnnually ?? true}
                  onChange={(v) => upd("grNumberRestartAnnually", v)}
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-border/40" role="group" aria-label={t("students.settings.title")}>
                <ToggleRow label={t("students.settings.autoGenerateId")} description={t("students.settings.autoGenerateIdDesc")} value={settingsDraft.autoGenerateId} onChange={(v) => upd("autoGenerateId", v)} />
                <ToggleRow label={t("students.settings.requireGuardian")} description={t("students.settings.requireGuardianDesc")} value={settingsDraft.requireGuardian} onChange={(v) => upd("requireGuardian", v)} />
                <ToggleRow label={t("students.settings.requirePhoto")} description={t("students.settings.requirePhotoDesc")} value={settingsDraft.requirePhoto} onChange={(v) => upd("requirePhoto", v)} />
              </div>

              <div className="py-3 border-t border-border mt-3 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-foreground">{t("students.settings.defaultViewLayout")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("students.settings.defaultViewLayoutDesc")}</p>
                </div>
                <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => upd("defaultViewLayout", "list")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                      (settingsDraft.defaultViewLayout || "list") === "list"
                        ? "bg-card text-foreground shadow-sm hover:bg-card"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t("students.settings.listView")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => upd("defaultViewLayout", "cards")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                      settingsDraft.defaultViewLayout === "cards"
                        ? "bg-card text-foreground shadow-sm hover:bg-card"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t("students.settings.cardGrid")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showFields && (
            <ModuleFieldsSetup
              editor={fieldsEditor}
              isCoreField={(tabId, key) => INITIAL_STUDENT_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
              onStateChange={() => setSaved(false)}
            />
          )}

          <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
            <Button
              type="button"
              onClick={handleSave}
              className={saved ? "bg-success hover:bg-success/90 text-success-foreground ml-auto" : "ml-auto"}
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? t("students.settings.saveSuccess") : t("students.settings.saveSettings")}
            </Button>
          </footer>
        </section>
      )}
    </div>
  );
}
