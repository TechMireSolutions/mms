import React, { useState, useEffect } from "react";
import { Save, School } from "lucide-react";
import {
  type TeachersSettings as TeachersSettingsType,
  TEACHERS_TAB_REGISTRY,
  INITIAL_TEACHERS_FIELD_SEED,
  TEACHER_SPECIALIZATION_VALUES,
} from "@mms/shared";
import { useTeacherConfig } from "@/tenant/features/teachers/hooks/useTeacherConfig";
import { useModuleFieldsEditor } from "@/tenant/hooks/useModuleFieldsEditor";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
}

function Toggle({ label, description, value, onChange }: ToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between py-1 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label={`Toggle ${label}`}
      />
    </div>
  );
}

export function TeachersSettings({ mode }: { mode?: "fields" | "preferences" }): React.JSX.Element {
  const { t } = useTranslation();
  const { settings, specializations, updateSettings } = useTeacherConfig();
  const [saved, setSaved] = useState<boolean>(false);

  // Prefs state
  const [idPrefix, setIdPrefix] = useState(settings.idPrefix);
  const [autoGenerateId, setAutoGenerateId] = useState(settings.autoGenerateId);
  const [requireContactLink, setRequireContactLink] = useState(settings.requireContactLink);
  const [defaultSpecialization, setDefaultSpecialization] = useState(settings.defaultSpecialization);

  const fieldsEditor = useModuleFieldsEditor({
    initialTabs: TEACHERS_TAB_REGISTRY,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || ["basic"])),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || [])),
  });

  useEffect(() => {
    if (!settings) return;
    setIdPrefix(settings.idPrefix);
    setAutoGenerateId(settings.autoGenerateId);
    setRequireContactLink(settings.requireContactLink);
    setDefaultSpecialization(settings.defaultSpecialization);

    const coreKeys = new Set(TEACHERS_TAB_REGISTRY.map((tabDefinition) => tabDefinition.key));
    const customTabs = (settings.formTabs || []).filter((tabDefinition) => !coreKeys.has(tabDefinition.key));
    const updatedTabs = [
      ...TEACHERS_TAB_REGISTRY,
      ...customTabs
    ].map((tabDefinition) => ({
      ...tabDefinition,
      enabled: tabDefinition.key === "basic" ? true : (settings.enabledTabs || ["basic"]).includes(tabDefinition.key)
    }));

    fieldsEditor.resetAllState(
      updatedTabs,
      settings.fields || {},
      settings.enabledTabs || ["basic"],
      settings.requiredTabs || []
    );
  }, [settings, fieldsEditor]);

  const specializationOptions = specializations.length > 0 ? specializations : [...TEACHER_SPECIALIZATION_VALUES];

  const handleSave = (): void => {
    const updatedFormTabs = fieldsEditor.formTabs.map((tab) => ({
      ...tab,
      enabled: fieldsEditor.enabledTabs.has(tab.key)
    }));

    const updatedSettings: TeachersSettingsType = {
      ...settings,
      idPrefix,
      autoGenerateId,
      requireContactLink,
      defaultSpecialization,
      enabledTabs: Array.from(fieldsEditor.enabledTabs),
      requiredTabs: Array.from(fieldsEditor.requiredTabs),
      formTabs: updatedFormTabs,
      fields: fieldsEditor.buildFieldsMap(),
    };

    updateSettings(updatedSettings);
    setSaved(true);
    notify.success(t("teachers.settings.saved"));
    setTimeout(() => setSaved(false), 2500);
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

          <Toggle
            label={t("teachers.settings.autoGenerateId")}
            value={autoGenerateId}
            onChange={(v) => { setAutoGenerateId(v); setSaved(false); }}
          />

          <Toggle
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
