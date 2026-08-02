import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type FieldConfig,
  type ContactPreferences,
  type TabDefinition,
  CONTACT_LOCKED_ENABLED_TABS,
  DEFAULT_FORM_TABS,
  INITIAL_FIELD_SEED,
  isContactLockedEnabledTab,
  normalizeContactDialCode,
  withContactLockedEnabledTabs,
} from "@mms/shared";
import type { CountryCodeEntry } from "@/lib/contacts/countryCodeOptions";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useContactsSetupSaveActions } from "@/tenant/features/contacts/hooks/useContactsSetupSaveActions";

function fieldsSetupSnapshot(input: {
  fields: FieldConfig["fields"];
  enabledTabs: Iterable<string>;
  requiredTabs: Iterable<string>;
  formTabs: TabDefinition[];
}): string {
  const enabled = withContactLockedEnabledTabs(input.enabledTabs).sort();
  const required = [...input.requiredTabs]
    .map((tabId) => tabId.toLowerCase())
    .sort();
  const formTabs = input.formTabs
    .map((tab) => ({
      key: tab.key.toLowerCase(),
      enabled: isContactLockedEnabledTab(tab.key) ? true : tab.enabled !== false,
      label: tab.label,
      order: tab.order ?? 0,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
  return JSON.stringify({
    fields: input.fields || {},
    enabled,
    required,
    formTabs,
  });
}

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
  const {
    updatePrefsAsync,
    prefs: contextPrefs,
    countryCodes,
    updateCountryCodes,
  } = useContactConfig();

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
      withContactLockedEnabledTabs(
        (config.formTabs && config.formTabs.length > 0 ? config.formTabs : DEFAULT_FORM_TABS)
          .filter((tab) => tab.enabled !== false)
          .map((tab) => tab.key),
      ),
    [config.formTabs],
  );

  const lockedEnabledTabs = useMemo(() => [...CONTACT_LOCKED_ENABLED_TABS], []);

  const { fieldsEditor, saved, setSaved, saveSettingsAsync } = useModuleSettingsEditor({
    config: editorConfig,
    tabRegistry: initialTabs,
    defaultEnabledTabs,
    lockedEnabledTabs,
  });

  const [prefs, setPrefs] = useState<ContactPreferences>(() => contextPrefs);
  const [countryCodesDraft, setCountryCodesDraft] = useState<CountryCodeEntry[]>(
    () => countryCodes,
  );

  const isPrefsDraftDirty = useMemo(
    () => JSON.stringify(prefs) !== JSON.stringify(contextPrefs),
    [prefs, contextPrefs],
  );

  const isCountryCodesDirty = useMemo(
    () => JSON.stringify(countryCodesDraft) !== JSON.stringify(countryCodes),
    [countryCodesDraft, countryCodes],
  );

  const isPreferencesDirty = isPrefsDraftDirty || isCountryCodesDirty;

  // Do not clobber local drafts while the user is editing Preferences.
  useEffect(() => {
    if (isPreferencesDirty) return;
    setPrefs(contextPrefs);
  }, [contextPrefs, isPreferencesDirty]);

  useEffect(() => {
    if (isPreferencesDirty) return;
    setCountryCodesDraft(countryCodes);
  }, [countryCodes, isPreferencesDirty]);

  const isFieldsDirty = useMemo(() => {
    const persistedEnabled =
      config.enabledTabs && config.enabledTabs.length > 0
        ? config.enabledTabs
        : defaultEnabledTabs;
    const persisted = fieldsSetupSnapshot({
      fields: config.fields,
      enabledTabs: persistedEnabled,
      requiredTabs: config.requiredTabs || [],
      formTabs: config.formTabs && config.formTabs.length > 0 ? config.formTabs : DEFAULT_FORM_TABS,
    });
    const draft = fieldsSetupSnapshot({
      fields: fieldsEditor.buildFieldsMap(),
      enabledTabs: fieldsEditor.enabledTabs,
      requiredTabs: fieldsEditor.requiredTabs,
      formTabs: fieldsEditor.formTabs,
    });
    return persisted !== draft;
  }, [config, defaultEnabledTabs, fieldsEditor]);

  const countryOptions = useMemo(
    () =>
      (countryCodesDraft || []).map((countryCodeObj) => {
        const formattedCode = normalizeContactDialCode(countryCodeObj.code || "");
        return {
          value: countryCodeObj.country,
          label: formattedCode
            ? `${countryCodeObj.country} (${formattedCode})`
            : countryCodeObj.country,
        };
      }),
    [countryCodesDraft],
  );

  const updatePreference = useCallback(
    <K extends keyof ContactPreferences>(key: K, value: ContactPreferences[K]): void => {
      setPrefs((currentPreferences) => ({ ...currentPreferences, [key]: value }));
      setSaved(false);
    },
    [setSaved],
  );

  const updateCountryCodesDraft = useCallback(
    (next: CountryCodeEntry[]) => {
      setCountryCodesDraft(next);
      setSaved(false);
    },
    [setSaved],
  );

  const {
    isSaving,
    handleDeleteFieldWithGuard,
    handleDeleteTabWithGuard,
    handleSave,
  } = useContactsSetupSaveActions({
    config,
    contextPrefs,
    prefs,
    setPrefs,
    fieldsEditor,
    mode,
    saveSettingsAsync,
    updatePrefsAsync,
    updateCountryCodes,
    countryCodesDraft,
    setCountryCodesDraft,
    setSaved,
  });

  const wrappedFieldsEditor = useMemo(
    () => ({
      ...fieldsEditor,
      handleDeleteField: handleDeleteFieldWithGuard,
      handleDeleteTab: handleDeleteTabWithGuard,
      formTabs: fieldsEditor.formTabs.map((tab) => {
        const seed = DEFAULT_FORM_TABS.find((entry) => entry.key === tab.key);
        return {
          ...tab,
          labelKey: tab.labelKey ?? seed?.labelKey,
          enabled: isContactLockedEnabledTab(tab.key) ? true : tab.enabled,
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
    [fieldsEditor, handleDeleteFieldWithGuard, handleDeleteTabWithGuard],
  );

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
    isPrefsDirty: isPreferencesDirty,
    isFieldsDirty,
    countryOptions,
    countryCodes: countryCodesDraft,
    updateCountryCodes: updateCountryCodesDraft,
    updatePreference,
    wrappedFieldsEditor,
    handleSave,
    isCoreField,
    showFields: mode === "fields",
    showPrefs: mode === "preferences",
  };
}
