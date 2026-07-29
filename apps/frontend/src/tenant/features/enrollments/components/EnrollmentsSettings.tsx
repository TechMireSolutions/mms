import React, { useMemo, useState } from "react";
import { Save, ClipboardList } from "lucide-react";
import {
  ENROLLMENTS_TAB_REGISTRY,
  INITIAL_ENROLLMENTS_FIELD_SEED,
  ENROLLMENTS_MODULE_MANIFEST,
  type AppTranslationKey,
} from "@mms/shared";
import { useEnrollmentConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "enrollments.setup.fields",
  preferences: "enrollments.setup.preferences",
};

export function EnrollmentsSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(ENROLLMENTS_MODULE_MANIFEST);
  const config = useEnrollmentConfig();
  const {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettings,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: ENROLLMENTS_TAB_REGISTRY,
  });

  const settingsSubTabs = useMemo(
    () =>
      ENROLLMENTS_MODULE_MANIFEST.setupSubTabs.map((key, index) => ({
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
    saveSettings();
    notify.success(t("enrollments.settings.saved"));
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
          {t("enrollments.setupReadOnly")}
        </p>
      ) : (
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground">{t("enrollments.settings.title")}</h3>
          </div>

          {showPrefs && (
            <div className="space-y-4 text-start">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={FORM_LABEL} htmlFor="maxStudentsPerClass">
                    {t("enrollments.settings.maxStudentsPerClass")}
                  </label>
                  <Input
                    id="maxStudentsPerClass"
                    type="number"
                    value={settingsDraft.maxStudentsPerClass || ""}
                    onChange={(event) => upd("maxStudentsPerClass", event.target.value)}
                  />
                </div>
                <div>
                  <label className={FORM_LABEL} htmlFor="dropDeadlineDays">
                    {t("enrollments.settings.dropDeadlineDays")}
                  </label>
                  <Input
                    id="dropDeadlineDays"
                    type="number"
                    value={settingsDraft.dropDeadlineDays || ""}
                    onChange={(event) => upd("dropDeadlineDays", event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <ToggleRow
                  label={t("enrollments.settings.waitlistEnabled")}
                  description={t("enrollments.settings.waitlistEnabledHint")}
                  value={settingsDraft.waitlistEnabled}
                  onChange={(value) => upd("waitlistEnabled", value)}
                />
                <ToggleRow
                  label={t("enrollments.settings.requireEligibilityCheck")}
                  description={t("enrollments.settings.requireEligibilityCheckHint")}
                  value={settingsDraft.requireEligibilityCheck}
                  onChange={(value) => upd("requireEligibilityCheck", value)}
                />
                <ToggleRow
                  label={t("enrollments.settings.autoAssignClass")}
                  description={t("enrollments.settings.autoAssignClassHint")}
                  value={settingsDraft.autoAssignClass}
                  onChange={(value) => upd("autoAssignClass", value)}
                />
                <ToggleRow
                  label={t("enrollments.settings.enrollmentApproval")}
                  description={t("enrollments.settings.enrollmentApprovalHint")}
                  value={settingsDraft.enrollmentApproval}
                  onChange={(value) => upd("enrollmentApproval", value)}
                />
                <ToggleRow
                  label={t("enrollments.settings.allowTransfers")}
                  description={t("enrollments.settings.allowTransfersHint")}
                  value={settingsDraft.allowTransfers}
                  onChange={(value) => upd("allowTransfers", value)}
                />
                <ToggleRow
                  label={t("enrollments.settings.reenrollmentReminder")}
                  description={t("enrollments.settings.reenrollmentReminderHint")}
                  value={settingsDraft.reenrollmentReminder}
                  onChange={(value) => upd("reenrollmentReminder", value)}
                />
              </div>
            </div>
          )}

          {showFields && (
            <ModuleFieldsSetup
              editor={fieldsEditor}
              isCoreField={(tabId, key) => INITIAL_ENROLLMENTS_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
              onStateChange={() => setSaved(false)}
            />
          )}

          <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
            <Button
              type="button"
              onClick={handleSave}
              className={saved ? "bg-success hover:bg-success/90 text-success-foreground ms-auto" : "ms-auto"}
            >
              <Save className="w-4 h-4" />
              {saved ? t("settings.savedBadge") : t("common.save")}
            </Button>
          </footer>
        </section>
      )}
    </div>
  );
}
