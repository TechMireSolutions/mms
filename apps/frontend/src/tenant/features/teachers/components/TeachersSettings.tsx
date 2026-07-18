import React, { useState, useEffect } from "react";
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
    settings,
    fieldsEditor,
    saved,
    setSaved,
    saveSettings,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: TEACHERS_TAB_REGISTRY,
  });

  // Prefs state
  const [idPrefix, setIdPrefix] = useState(settings.idPrefix);
  const [autoGenerateId, setAutoGenerateId] = useState(settings.autoGenerateId);
  const [requireContactLink, setRequireContactLink] = useState(settings.requireContactLink);
  const [defaultSpecialization, setDefaultSpecialization] = useState(settings.defaultSpecialization);

  useEffect(() => {
    if (!settings) return;
    setIdPrefix(settings.idPrefix);
    setAutoGenerateId(settings.autoGenerateId);
    setRequireContactLink(settings.requireContactLink);
    setDefaultSpecialization(settings.defaultSpecialization);
  }, [settings]);

  const specializationOptions = specializations.length > 0 ? specializations : [...TEACHER_SPECIALIZATION_VALUES];

  const handleSave = (): void => {
    saveSettings({
      idPrefix,
      autoGenerateId,
      requireContactLink,
      defaultSpecialization,
    });
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
              value={idPrefix}
              onChange={(event) => { setIdPrefix(event.target.value); setSaved(false); }}
            />
          </div>

          <ToggleRow
            label={t("teachers.settings.autoGenerateId")}
            value={autoGenerateId}
            onChange={(v) => { setAutoGenerateId(v); setSaved(false); }}
          />

          <ToggleRow
            label={t("teachers.settings.requireContactLink")}
            value={requireContactLink}
            onChange={(v) => { setRequireContactLink(v); setSaved(false); }}
          />

          <div>
            <label className={FORM_LABEL} htmlFor="teacher-defaultSpecialization">{t("teachers.settings.defaultSpecialization")}</label>
            <FormSelect
              id="teacher-defaultSpecialization"
              value={defaultSpecialization}
            onChange={(specialization) => { setDefaultSpecialization(specialization); setSaved(false); }}
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
