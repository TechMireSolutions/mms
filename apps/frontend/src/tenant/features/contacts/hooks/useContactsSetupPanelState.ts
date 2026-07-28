import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type FieldConfig,
  type ContactPreferences,
  type TabDefinition,
  CONFIG_VERSION,
  toTitleCase,
  DEFAULT_COLUMN_REGISTRY,
  getContactFieldRemovalIssues,
  DEFAULT_FORM_TABS,
  INITIAL_FIELD_SEED,
  CONTACTS_MODULE_MANIFEST,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactMutations } from "@/tenant/features/contacts/hooks/useContacts";
import { apiJson } from "@/lib/apiClient";
import { notify } from "@/lib/notify";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";

export function useContactsSetupPanelState({
  config,
  onConfigChange,
  onConfigChangeAsync,
  mode,
}: {
  config: FieldConfig;
  onConfigChange: (config: FieldConfig) => void;
  onConfigChangeAsync?: (config: FieldConfig) => Promise<void>;
  mode?: "fields" | "preferences";
}) {
  const { updatePrefsAsync, prefs: contextPrefs, countryCodes } = useContactConfig();
  const { logSetupAudit } = useContactMutations();
  const { t } = useTranslation();

  const editorConfig = useMemo(
    () => ({
      settings: config,
      updateSettings: onConfigChange,
      updateSettingsAsync: onConfigChangeAsync,
    }),
    [config, onConfigChange, onConfigChangeAsync],
  );

  const initialTabs = useMemo<TabDefinition[]>(
    () => (config.formTabs && config.formTabs.length > 0 ? config.formTabs : DEFAULT_FORM_TABS),
    [config.formTabs],
  );

  const defaultEnabledTabs = useMemo(
    () =>
      (config.formTabs && config.formTabs.length > 0
        ? config.formTabs
        : DEFAULT_FORM_TABS
      )
        .filter((tab) => tab.enabled !== false)
        .map((tab) => tab.key),
    [config.formTabs],
  );

  const {
    fieldsEditor,
    saved,
    setSaved,
    saveSettingsAsync,
  } = useModuleSettingsEditor({
    config: editorConfig,
    tabRegistry: initialTabs,
    defaultEnabledTabs,
  });

  const [prefs, setPrefs] = useState<ContactPreferences>(() => contextPrefs);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPrefs(contextPrefs);
  }, [contextPrefs]);

  const isPrefsDirty = useMemo(
    () => JSON.stringify(prefs) !== JSON.stringify(contextPrefs),
    [prefs, contextPrefs],
  );

  const countryOptions = useMemo(
    () =>
      (countryCodes || []).map((countryCodeObj) => {
        const codeStr = (countryCodeObj.code || "").trim();
        const formattedCode = codeStr.startsWith("+") ? codeStr : `+${codeStr}`;
        return {
          value: countryCodeObj.country,
          label: `${countryCodeObj.country} (${formattedCode})`,
        };
      }),
    [countryCodes],
  );

  const updatePreference = useCallback(
    <K extends keyof ContactPreferences>(key: K, value: ContactPreferences[K]): void => {
      setPrefs((currentPreferences) => ({ ...currentPreferences, [key]: value }));
      setSaved(false);
    },
    [setSaved],
  );

  const handleDeleteFieldWithGuard = useCallback(
    async (tabId: string, fieldId: string) => {
      const issues = getContactFieldRemovalIssues({
        fieldKey: fieldId,
        columnRegistry: config.columnRegistry || DEFAULT_COLUMN_REGISTRY,
        preferences: contextPrefs,
      });
      if (issues.length > 0) {
        const issue = issues[0];
        notify.error(
          t(
            issue.messageKey as Parameters<typeof t>[0],
            issue.count !== undefined ? { count: issue.count } : undefined,
          ),
        );
        return;
      }

      try {
        const { count } = await apiJson<{ count: number }>(
          `${CONTACTS_MODULE_MANIFEST.restBasePath}/field-usage/${encodeURIComponent(fieldId)}`,
        );
        if (count > 0) {
          notify.error(t("contacts.setup.fieldHasContactData", { count }));
          return;
        }
      } catch {
        notify.error(t("contacts.saveFailed"));
        return;
      }

      fieldsEditor.handleDeleteField(tabId, fieldId);
      setSaved(false);
    },
    [config.columnRegistry, contextPrefs, fieldsEditor, setSaved, t],
  );

  const wrappedFieldsEditor = useMemo(
    () => ({
      ...fieldsEditor,
      handleDeleteField: handleDeleteFieldWithGuard,
      formTabs: fieldsEditor.formTabs.map((tab) => {
        const seed = DEFAULT_FORM_TABS.find((entry) => entry.key === tab.key);
        return {
          ...tab,
          labelKey: tab.labelKey ?? seed?.labelKey,
        };
      }),
      tabFields: Object.fromEntries(
        Object.entries(fieldsEditor.tabFields).map(([tabId, list]) => {
          const seedFields = INITIAL_FIELD_SEED[tabId] || [];
          const seedByKey = new Map(seedFields.map((field) => [field.key, field]));
          return [
            tabId,
            list.map((field) => ({
              ...field,
              labelKey: field.labelKey ?? seedByKey.get(field.key)?.labelKey,
              descriptionKey: field.descriptionKey ?? seedByKey.get(field.key)?.descriptionKey,
            })),
          ];
        }),
      ),
    }),
    [fieldsEditor, handleDeleteFieldWithGuard],
  );

  const handleSave = useCallback(async (): Promise<void> => {
    if (prefs.defaultProvince && /\d/.test(prefs.defaultProvince)) {
      notify.error(t("contacts.setup.invalidProvince"));
      return;
    }
    if (prefs.defaultCity && /\d/.test(prefs.defaultCity)) {
      notify.error(t("contacts.setup.invalidCity"));
      return;
    }

    setIsSaving(true);
    try {
      const applyTitleCaseToTabs = (tabs: TabDefinition[]) =>
        tabs.map((tab) => ({ ...tab, label: toTitleCase(tab.label) }));

      await saveSettingsAsync(
        {},
        {
          version: CONFIG_VERSION,
          pageTabs: applyTitleCaseToTabs(config.pageTabs || []),
          formTabs: applyTitleCaseToTabs(fieldsEditor.formTabs),
          detailTabs: applyTitleCaseToTabs(config.detailTabs || []),
          settingsSubTabs: applyTitleCaseToTabs(config.settingsSubTabs || []),
          columnRegistry: config.columnRegistry,
        },
        { markSaved: false },
      );

      const updatedPrefs = {
        ...prefs,
        defaultCountry: prefs.defaultCountry ? toTitleCase(prefs.defaultCountry.trim()) : "",
        defaultProvince: prefs.defaultProvince ? toTitleCase(prefs.defaultProvince.trim()) : "",
        defaultCity: prefs.defaultCity ? toTitleCase(prefs.defaultCity.trim()) : "",
      };

      await updatePrefsAsync(updatedPrefs);

      const auditArea = mode === "preferences" ? "preferences" : "fields";
      await logSetupAudit.mutateAsync({
        area: auditArea,
        summary: t("contacts.setup.auditSummary", { area: auditArea }),
      });

      setPrefs(updatedPrefs);
      setSaved(true);
    } catch {
      setSaved(false);
      notify.error(t("contacts.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }, [prefs, config, fieldsEditor.formTabs, mode, saveSettingsAsync, updatePrefsAsync, logSetupAudit, setSaved, t]);

  const isCoreField = useCallback(
    (tabId: string, fieldKey: string): boolean =>
      INITIAL_FIELD_SEED[tabId]?.some((field) => field.key === fieldKey) ?? false,
    [],
  );

  return {
    prefs,
    saved,
    setSaved,
    isSaving,
    isPrefsDirty,
    countryOptions,
    updatePreference,
    wrappedFieldsEditor,
    handleSave,
    isCoreField,
    showFields: mode === "fields",
    showPrefs: mode === "preferences",
  };
}
