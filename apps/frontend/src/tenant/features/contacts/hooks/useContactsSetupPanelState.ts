import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type FieldConfig,
  type ContactPreferences,
  type TabDefinition,
  DEFAULT_FORM_TABS,
  INITIAL_FIELD_SEED,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useContactsSetupSaveActions } from "@/tenant/features/contacts/hooks/useContactsSetupSaveActions";

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
  const { updatePrefsAsync, prefs: contextPrefs, countryCodes, updateCountryCodes, updateRelationshipPairs } =
    useContactConfig();

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
      (config.formTabs && config.formTabs.length > 0 ? config.formTabs : DEFAULT_FORM_TABS)
        .filter((tab) => tab.enabled !== false)
        .map((tab) => tab.key),
    [config.formTabs],
  );

  const { fieldsEditor, saved, setSaved, saveSettingsAsync } = useModuleSettingsEditor({
    config: editorConfig,
    tabRegistry: initialTabs,
    defaultEnabledTabs,
  });

  const [prefs, setPrefs] = useState<ContactPreferences>(() => contextPrefs);

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

  const { isSaving, handleDeleteFieldWithGuard, handleSave } = useContactsSetupSaveActions({
    config,
    contextPrefs,
    prefs,
    setPrefs,
    fieldsEditor,
    mode,
    saveSettingsAsync,
    updatePrefsAsync,
    syncRelationshipsFromPairs: updateRelationshipPairs,
    setSaved,
  });

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
    countryCodes,
    updateCountryCodes,
    updatePreference,
    wrappedFieldsEditor,
    handleSave,
    isCoreField,
    showFields: mode === "fields",
    showPrefs: mode === "preferences",
  };
}
