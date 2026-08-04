import React, { useMemo, useState } from "react";
import {
  STUDENT_TAB_REGISTRY,
  DEFAULT_STUDENT_ENABLED_TABS,
  DEFAULT_STUDENT_REQUIRED_TABS,
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  INITIAL_STUDENT_FIELD_SEED,
  STUDENTS_MODULE_MANIFEST,
  type AppTranslationKey,
} from "@mms/shared";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_INPUT, WORK_SURFACE } from "@/components/ui/formStyles";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { SegmentedPillFilter } from "@/components/ui/SegmentedPillFilter";
import { Loader2, Save, GraduationCap } from "lucide-react";

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "students.setup.fields",
  preferences: "students.setup.preferences",
};

const PREF_KEYS = [
  "grNumberTemplate",
  "grNumberDigits",
  "grNumberRestartAnnually",
  "autoGenerateId",
  "requireGuardian",
  "requirePhoto",
  "defaultViewLayout",
] as const;

function studentsFieldsSnapshot(input: {
  fields: unknown;
  enabledTabs: Iterable<string>;
  requiredTabs: Iterable<string>;
  formTabs: Array<{ key: string; enabled?: boolean; label?: string; order?: number }>;
}): string {
  const enabled = [...input.enabledTabs].map((tab) => tab.toLowerCase()).sort();
  const required = [...input.requiredTabs].map((tab) => tab.toLowerCase()).sort();
  const formTabs = input.formTabs
    .map((tab) => ({
      key: tab.key.toLowerCase(),
      enabled: tab.enabled !== false,
      label: tab.label,
      order: tab.order ?? 0,
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
  return JSON.stringify({
    fields: input.fields || {},
    enabled,
    required,
    formTabs,
  });
}

export default function StudentsSettings(): React.ReactElement {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(STUDENTS_MODULE_MANIFEST);
  const config = useStudentConfig();
  const {
    settings,
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettingsAsync,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: STUDENT_TAB_REGISTRY,
    defaultEnabledTabs: DEFAULT_STUDENT_ENABLED_TABS,
    defaultRequiredTabs: DEFAULT_STUDENT_REQUIRED_TABS,
  });

  const settingsSubTabs = useMemo(
    () =>
      STUDENTS_MODULE_MANIFEST.setupSubTabs.map((key, index) => ({
        key,
        label: t(SETUP_TAB_LABEL_KEYS[key]),
        order: index,
      })),
    [t],
  );

  const [sub, setSub] = useState<string>(() => settingsSubTabs[0]?.key || "fields");
  const [saving, setSaving] = useState(false);
  const showFields = sub === "fields";
  const showPrefs = sub === "preferences";

  const isFieldsDirty = useMemo(() => {
    const persistedEnabled =
      settings.enabledTabs && settings.enabledTabs.length > 0
        ? settings.enabledTabs
        : DEFAULT_STUDENT_ENABLED_TABS;
    return (
      studentsFieldsSnapshot({
        fields: fieldsEditor.buildFieldsMap(),
        enabledTabs: fieldsEditor.enabledTabs,
        requiredTabs: fieldsEditor.requiredTabs,
        formTabs: fieldsEditor.formTabs,
      }) !==
      studentsFieldsSnapshot({
        fields: settings.fields,
        enabledTabs: persistedEnabled,
        requiredTabs: settings.requiredTabs || DEFAULT_STUDENT_REQUIRED_TABS,
        formTabs: settings.formTabs || STUDENT_TAB_REGISTRY,
      })
    );
  }, [fieldsEditor, settings]);

  const isPrefsDirty = useMemo(() => {
    const draft = settingsDraft as unknown as Record<string, unknown>;
    const savedSettings = settings as unknown as Record<string, unknown>;
    return PREF_KEYS.some((key) => JSON.stringify(draft[key]) !== JSON.stringify(savedSettings[key]));
  }, [settings, settingsDraft]);

  const isDirty = showPrefs ? isPrefsDirty : isFieldsDirty;

  const handleSave = async (): Promise<void> => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await saveSettingsAsync(undefined, {
        version: 3,
        columnRegistry: settings.columnRegistry || DEFAULT_STUDENT_COLUMN_REGISTRY,
      });
    } finally {
      setSaving(false);
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
          {t("students.setupReadOnly")}
        </p>
      ) : (
        <section className={`${WORK_SURFACE} p-5 space-y-5`} aria-labelledby="students-settings-title">
          <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            </div>
            <h3 id="students-settings-title" className="text-sm font-bold text-foreground">
              {t("students.settings.title")}
            </h3>
          </div>

          {showPrefs && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {t("students.settings.grSectionTitle")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
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

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border py-3">
                <div className="min-w-0 text-start">
                  <p className="text-sm font-semibold text-foreground">{t("students.settings.defaultViewLayout")}</p>
                  <p className="text-xs text-muted-foreground">{t("students.settings.defaultViewLayoutDesc")}</p>
                </div>
                <SegmentedPillFilter
                  size="sm"
                  value={(settingsDraft.defaultViewLayout || "table") as "table" | "cards"}
                  onChange={(value) => upd("defaultViewLayout", value)}
                  options={[
                    { value: "table", label: t("students.settings.tableView") },
                    { value: "cards", label: t("students.settings.cardGrid") },
                  ]}
                />
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
              onClick={() => { void handleSave(); }}
              disabled={saving || !isDirty}
              aria-busy={saving}
              className={saved ? "bg-success hover:bg-success/90 text-success-foreground ms-auto" : "ms-auto"}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
              )}{" "}
              {saved ? t("students.settings.saveSuccess") : t("students.settings.saveSettings")}
            </Button>
          </footer>
        </section>
      )}
    </div>
  );
}
