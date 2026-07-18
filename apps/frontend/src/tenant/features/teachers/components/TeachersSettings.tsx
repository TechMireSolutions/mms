import React from "react";
import { Save, School } from "lucide-react";
import {
  TEACHERS_TAB_REGISTRY,
  INITIAL_TEACHERS_FIELD_SEED,
  TEACHER_SPECIALIZATION_VALUES,
} from "@mms/shared";
import { useTeacherConfig } from "@/tenant/features/teachers/hooks/useTeacherConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";

export function TeachersSettings({ mode }: { mode?: "fields" | "preferences" }): React.JSX.Element {
  const { t } = useTranslation();
  const config = useTeacherConfig();
  const { specializations } = config;
  const {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettings,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: TEACHERS_TAB_REGISTRY,
  });

  const specializationOptions = specializations.length > 0 ? specializations : [...TEACHER_SPECIALIZATION_VALUES];

  const handleSave = (): void => {
    saveSettings();
    notify.success(t("teachers.settings.saved"));
  };

  const showPrefs = mode === "preferences";
  const showFields = mode === "fields";

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <School className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-[13px] font-bold text-foreground">{t("teachers.settings.title")}</h3>
      </div>

      {showPrefs && (
        <div className="space-y-4 text-left">
          <div>
            <label className={FORM_LABEL} htmlFor="teacher-idPrefix">{t("teachers.settings.idPrefix")}</label>
            <Input
              id="teacher-idPrefix"
              value={settingsDraft.idPrefix || ""}
              onChange={(event) => upd("idPrefix", event.target.value)}
            />
          </div>

          <ToggleRow
            label={t("teachers.settings.autoGenerateId")}
            value={settingsDraft.autoGenerateId}
            onChange={(v) => upd("autoGenerateId", v)}
          />

          <ToggleRow
            label={t("teachers.settings.requireContactLink")}
            value={settingsDraft.requireContactLink}
            onChange={(v) => upd("requireContactLink", v)}
          />

          <div>
            <label className={FORM_LABEL} htmlFor="teacher-defaultSpecialization">{t("teachers.settings.defaultSpecialization")}</label>
            <FormSelect
              id="teacher-defaultSpecialization"
              value={settingsDraft.defaultSpecialization}
              onChange={(specialization) => upd("defaultSpecialization", specialization)}
              options={specializationOptions}
            />
          </div>
        </div>
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={fieldsEditor}
          isCoreField={(tabId, key) => INITIAL_TEACHERS_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
          onStateChange={() => setSaved(false)}
        />
      )}

      <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
        <Button
          type="button"
          onClick={handleSave}
          className={saved ? "bg-success hover:bg-success/90 text-success-foreground ml-auto" : "ml-auto"}
        >
          <Save className="w-4 h-4" />
          {saved ? t("settings.savedBadge") : t("common.save")}
        </Button>
      </footer>
    </section>
  );
}
