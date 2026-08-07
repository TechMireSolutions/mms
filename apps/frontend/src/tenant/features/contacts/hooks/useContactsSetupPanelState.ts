import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type FieldConfig,
  type ContactPreferences,
  type TabDefinition,
  CONTACT_LOCKED_ENABLED_TABS,
  INITIAL_FIELD_SEED,
  normalizeContactDialCode,
  getContactSeedFormTab,
  isContactLockedEnabledTab,
} from "@mms/shared";
import type { CountryCodeEntry } from "@/lib/contacts/countryCodeOptions";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { wrapModuleSetupFieldsEditor } from "@/lib/setup/wrapModuleSetupFieldsEditor";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useContactsSetupSaveActions } from "@/tenant/features/contacts/hooks/useContactsSetupSaveActions";
import {
  fieldsSetupSnapshot,
  resolveSetupEnabledTabs,
  resolveSetupFormTabs,
} from "@/tenant/features/contacts/hooks/contactsSetupPanelSnapshots";
import { buildCountrySelectOptions } from "@/tenant/features/contacts/hooks/contactsSetupPanelEditor";

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
    () => resolveSetupFormTabs(config.formTabs, config.fields),
    [config.formTabs, config.fields],
  );

  const defaultEnabledTabs = useMemo(
    () => resolveSetupEnabledTabs(config.formTabs, config.fields),
    [config.formTabs, config.fields],
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

  useEffect(() => {
    if (isPreferencesDirty) return;
    setPrefs(contextPrefs);
  }, [contextPrefs, isPreferencesDirty]);

  useEffect(() => {
    if (isPreferencesDirty) return;
    setCountryCodesDraft(countryCodes);
  }, [countryCodes, isPreferencesDirty]);

  const isFieldsDirty = useMemo(() => {
    const formTabsForCompare = resolveSetupFormTabs(config.formTabs, config.fields);
    const persistedEnabled =
      config.enabledTabs && config.enabledTabs.length > 0
        ? config.enabledTabs
        : defaultEnabledTabs;
    const persisted = fieldsSetupSnapshot({
      fields: config.fields,
      enabledTabs: persistedEnabled,
      requiredTabs: config.requiredTabs || [],
      formTabs: formTabsForCompare,
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
    () => buildCountrySelectOptions(countryCodesDraft, normalizeContactDialCode),
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
    () =>
      wrapModuleSetupFieldsEditor({
        fieldsEditor,
        handleDeleteField: handleDeleteFieldWithGuard,
        handleDeleteTab: handleDeleteTabWithGuard,
        getSeedTab: getContactSeedFormTab,
        initialFieldSeed: INITIAL_FIELD_SEED,
        isLockedTab: isContactLockedEnabledTab,
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
