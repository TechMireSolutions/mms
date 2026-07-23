import React, { useState } from "react";
import { Save, Users, AlertTriangle } from "lucide-react";
import {
  FieldConfig, ContactPreferences, TabDefinition,
  CONFIG_VERSION,
  toTitleCase,
  DEFAULT_COLUMN_REGISTRY,
  getContactFieldRemovalIssues,
  DEFAULT_FORM_TABS,
  INITIAL_FIELD_SEED,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactMutations } from "@/tenant/features/contacts/hooks/useContacts";
import { apiJson } from "@/lib/apiClient";
import { CONTACTS_MODULE_CONTRACT } from "@mms/shared";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";

interface ContactsSetupPanelProps {
  config: FieldConfig;
  onConfigChange: (config: FieldConfig) => void;
  mode?: "fields" | "preferences";
}

export default function ContactsSetupPanel({ config, onConfigChange, mode }: ContactsSetupPanelProps): React.JSX.Element {
  const { updatePrefs, prefs: contextPrefs, countryCodes } = useContactConfig();
  const { logSetupAudit } = useContactMutations();
  const { t } = useTranslation();

  const getInitialTabs = (): TabDefinition[] => {
    return config.formTabs && config.formTabs.length > 0 ? config.formTabs : DEFAULT_FORM_TABS;
  };

  const editorConfig = React.useMemo(() => ({
    settings: config,
    updateSettings: onConfigChange,
  }), [config, onConfigChange]);

  const {
    fieldsEditor,
    saved,
    setSaved,
    saveSettings,
  } = useModuleSettingsEditor({
    config: editorConfig,
    tabRegistry: getInitialTabs(),
  });

  const [prefs, setPrefs] = useState<ContactPreferences>(() => contextPrefs);

  const countryOptions = React.useMemo(() => {
    return (countryCodes || []).map((c) => ({
      value: c.country,
      label: `${c.country} (+${c.code})`,
    }));
  }, [countryCodes]);

  const updatePreference = <K extends keyof ContactPreferences>(key: K, value: ContactPreferences[K]): void => {
    setPrefs((currentPreferences) => ({ ...currentPreferences, [key]: value }));
    setSaved(false);
  };

  // Wrap handleDeleteField to add CRM-specific checks
  const originalDeleteField = fieldsEditor.handleDeleteField;
  fieldsEditor.handleDeleteField = async (tabId: string, fieldId: string) => {
    const issues = getContactFieldRemovalIssues({
      fieldKey: fieldId,
      columnRegistry: config.columnRegistry || DEFAULT_COLUMN_REGISTRY,
      preferences: contextPrefs,
    });
    if (issues.length > 0) {
      const issue = issues[0];
      notify.error(
        t(issue.messageKey as Parameters<typeof t>[0], issue.count !== undefined ? { count: issue.count } : undefined),
      );
      return;
    }

    try {
      const { count } = await apiJson<{ count: number }>(
        `${CONTACTS_MODULE_CONTRACT.restBasePath}/field-usage/${encodeURIComponent(fieldId)}`,
      );
      if (count > 0) {
        notify.error(t("contacts.setup.fieldHasContactData", { count }));
        return;
      }
    } catch {
      notify.error(t("contacts.saveFailed"));
      return;
    }
    originalDeleteField(tabId, fieldId);
    setSaved(false);
  };

  const handleSave = (): void => {
    // Validate inputs (e.g. no numbers inside province/city names)
    if (prefs.defaultProvince && /\d/.test(prefs.defaultProvince)) {
      notify.error(t("contacts.setup.invalidProvince"));
      return;
    }
    if (prefs.defaultCity && /\d/.test(prefs.defaultCity)) {
      notify.error(t("contacts.setup.invalidCity"));
      return;
    }

    const applyTitleCaseToTabs = (tabs: TabDefinition[]) => tabs.map((tab) => ({ ...tab, label: toTitleCase(tab.label) }));
    saveSettings({}, {
      version: CONFIG_VERSION,
      pageTabs: applyTitleCaseToTabs(config.pageTabs || []),
      formTabs: applyTitleCaseToTabs(fieldsEditor.formTabs),
      detailTabs: applyTitleCaseToTabs(config.detailTabs || []),
      settingsSubTabs: applyTitleCaseToTabs(config.settingsSubTabs || []),
      columnRegistry: config.columnRegistry,
    });
    const updatedPrefs = {
      ...prefs,
      defaultCountry: prefs.defaultCountry ? toTitleCase(prefs.defaultCountry.trim()) : "",
      defaultProvince: prefs.defaultProvince ? toTitleCase(prefs.defaultProvince.trim()) : "",
      defaultCity: prefs.defaultCity ? toTitleCase(prefs.defaultCity.trim()) : "",
    };
    setPrefs(updatedPrefs);
    updatePrefs(updatedPrefs);
    const auditArea = showPrefs ? "preferences" : "fields";
    void logSetupAudit.mutateAsync({
      area: auditArea,
      summary: t("contacts.setup.auditSummary", { area: auditArea }),
    });
  };

  const isCoreField = (tabId: string, fieldKey: string): boolean =>
    INITIAL_FIELD_SEED[tabId]?.some((f) => f.key === fieldKey) ?? false;

  const showFields = mode === "fields";
  const showPrefs = mode === "preferences";

  return (
    <div className="space-y-6 max-w-3xl text-left">
      {showFields && (
        <ModuleFieldsSetup
          editor={fieldsEditor}
          isCoreField={isCoreField}
          onStateChange={() => setSaved(false)}
        />
      )}

      {showPrefs && (
        <>
          {!saved && (
            <div
              className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
              role="alert"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t("contacts.setup.unsavedWarning")}</span>
            </div>
          )}
          
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{t("contacts.setup.generalPreferences")}</span>
            </div>
            <div className="p-4 space-y-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={FORM_LABEL} htmlFor="defaultCountry">{t("contacts.setup.defaultCountry")}</label>
                  <FormSelect
                    id="defaultCountry"
                    value={prefs.defaultCountry || ""}
                    onChange={(val) => updatePreference("defaultCountry", val)}
                    options={countryOptions}
                    placeholder={t("contacts.setup.defaultCountryPlaceholder")}
                  />
                </div>
                <div>
                  <label className={FORM_LABEL} htmlFor="defaultProvince">{t("contacts.setup.defaultProvince")}</label>
                  <Input
                    id="defaultProvince"
                    value={prefs.defaultProvince || ""}
                    onChange={(e) => updatePreference("defaultProvince", e.target.value)}
                    placeholder={t("contacts.setup.defaultProvincePlaceholder")}
                  />
                </div>
                <div>
                  <label className={FORM_LABEL} htmlFor="defaultCity">{t("contacts.setup.defaultCity")}</label>
                  <Input
                    id="defaultCity"
                    value={prefs.defaultCity || ""}
                    onChange={(e) => updatePreference("defaultCity", e.target.value)}
                    placeholder={t("contacts.setup.defaultCityPlaceholder")}
                  />
                </div>
              </div>

              <div className="border-t border-border/60 pt-3 mt-3 space-y-2">
                <ToggleRow
                  label={t("contacts.setup.showDetailedSolarAge")}
                  description={t("contacts.setup.showDetailedSolarAgeDesc")}
                  value={!!prefs.showDetailedSolarAge}
                  onChange={(val) => updatePreference("showDetailedSolarAge", val)}
                />
                <ToggleRow
                  label={t("contacts.setup.showLunarDob")}
                  description={t("contacts.setup.showLunarDobDesc")}
                  value={!!prefs.showLunarDob}
                  onChange={(val) => updatePreference("showLunarDob", val)}
                />
                <ToggleRow
                  label={t("contacts.setup.showDetailedLunarAge")}
                  description={t("contacts.setup.showDetailedLunarAgeDesc")}
                  value={!!prefs.showDetailedLunarAge}
                  onChange={(val) => updatePreference("showDetailedLunarAge", val)}
                />
              </div>
            </div>
          </section>
        </>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-border sticky bottom-0 bg-background pb-2 flex-wrap">
        <Button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-5 min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          <span>{saved ? t("contacts.form.saved") : t("contacts.setup.saveAndApply")}</span>
        </Button>
      </div>
    </div>
  );
}
