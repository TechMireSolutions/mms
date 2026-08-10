import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  type FieldConfig,
  type ContactPreferences,
  type FieldDefinition,
  type TabDefinition,
  CONFIG_VERSION,
  DEFAULT_COLUMN_REGISTRY,
  syncContactColumnRegistryWithFields,
  isContactLockedEnabledTab,
  withContactLockedEnabledTabs,
} from "@mms/shared";
import { useModuleSetupSaveActions } from "@/lib/setup/useModuleSetupSaveActions";
import { useContactMutations } from "@/tenant/features/contacts/hooks/useContacts";
import { useContactsPreferencesSave } from "@/tenant/features/contacts/hooks/useContactsPreferencesSave";
import { useContactsSetupFieldDeleteGuard } from "@/tenant/features/contacts/hooks/useContactsSetupFieldDeleteGuard";
import { useContactsSetupTabDeleteGuard } from "@/tenant/features/contacts/hooks/useContactsSetupTabDeleteGuard";
import { syncContactsCustomTabs } from "@/tenant/features/contacts/hooks/syncContactsCustomTabs";
import {
  fieldsSetupSnapshot,
  resolveSetupEnabledTabs,
  resolveSetupFormTabs,
} from "@/tenant/features/contacts/hooks/contactsSetupPanelSnapshots";
import type { CountryCodeEntry } from "@/lib/contacts/countryCodeOptions";

type FieldsEditorLike = {
  formTabs: TabDefinition[];
  enabledTabs: Set<string>;
  requiredTabs: Set<string>;
  tabFields: Record<string, FieldDefinition[]>;
  buildFieldsMap: () => FieldConfig["fields"];
  markDraftPristine: () => void;
  handleDeleteField: (tabId: string, fieldId: string) => void | boolean | Promise<void | boolean>;
  handleDeleteTab: (tabId: string) => void | boolean | Promise<void | boolean>;
};

export function useContactsSetupSaveActions({
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
}: {
  config: FieldConfig;
  contextPrefs: ContactPreferences;
  prefs: ContactPreferences;
  setPrefs: Dispatch<SetStateAction<ContactPreferences>>;
  fieldsEditor: FieldsEditorLike;
  mode?: "fields" | "preferences";
  saveSettingsAsync: (
    fields: Record<string, unknown>,
    settings: Record<string, unknown>,
    options?: { markSaved?: boolean },
  ) => Promise<void>;
  updatePrefsAsync: (prefs: ContactPreferences) => Promise<void>;
  updateCountryCodes: (countryCodes: CountryCodeEntry[]) => void | Promise<void>;
  countryCodesDraft: CountryCodeEntry[];
  setCountryCodesDraft: Dispatch<SetStateAction<CountryCodeEntry[]>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
}) {
  const { logSetupAudit } = useContactMutations();
  const [isSaving, setIsSaving] = useState(false);

  const fieldsDraft = useMemo(
    () => ({
      buildFieldsMap: fieldsEditor.buildFieldsMap,
      enabledTabs: fieldsEditor.enabledTabs,
      tabFields: fieldsEditor.tabFields,
    }),
    [fieldsEditor.buildFieldsMap, fieldsEditor.enabledTabs, fieldsEditor.tabFields],
  );

  const handleDeleteFieldWithGuard = useContactsSetupFieldDeleteGuard({
    config,
    contextPrefs,
    fieldsDraft,
    onDeleteField: fieldsEditor.handleDeleteField,
  });

  const handleDeleteTabWithGuard = useContactsSetupTabDeleteGuard({
    config,
    contextPrefs,
    fieldsDraft,
    onDeleteTab: fieldsEditor.handleDeleteTab,
  });

  const preferencesSave = useContactsPreferencesSave({
    contextPrefs,
    prefs,
    setPrefs,
    updatePrefsAsync,
    updateCountryCodes,
    countryCodesDraft,
    setCountryCodesDraft,
    setSaved,
  });

  const defaultTabRegistry = useMemo(
    () => resolveSetupFormTabs(config.formTabs, config.fields),
    [config.formTabs, config.fields],
  );

  const fieldsSave = useModuleSetupSaveActions<FieldConfig>({
    settings: config,
    settingsDraft: config,
    fieldsEditor,
    mode: "fields",
    setSaved,
    fieldsSnapshot: fieldsSetupSnapshot,
    resolvePersistedEnabledTabs: (settings) =>
      settings.enabledTabs && settings.enabledTabs.length > 0
        ? settings.enabledTabs
        : resolveSetupEnabledTabs(settings.formTabs, settings.fields),
    defaultRequiredTabs: [],
    defaultTabRegistry,
    lockedTabPredicate: isContactLockedEnabledTab,
    defaultColumnRegistry: config.columnRegistry || DEFAULT_COLUMN_REGISTRY,
    registrySyncFn: (registry, fields, enabledTabIds) =>
      syncContactColumnRegistryWithFields(
        registry,
        fields,
        withContactLockedEnabledTabs(enabledTabIds),
      ),
    syncCustomTabs: syncContactsCustomTabs,
    prefsKeys: [],
    normalizePrefs: (draft) => draft,
    buildFieldConfigPayload: ({ syncedRegistry }) => ({
      version: CONFIG_VERSION,
      pageTabs: config.pageTabs || [],
      detailTabs: (config.detailTabs || []).filter((tab) => tab.key !== "network"),
      settingsSubTabs: config.settingsSubTabs || [],
      columnRegistry: syncedRegistry,
    }),
    fieldConfigMutation: {
      mutateAsync: (payload) =>
        saveSettingsAsync({}, payload as Record<string, unknown>, { markSaved: false }),
    },
    preferencesMutation: { mutateAsync: async () => undefined },
    logSetupAudit,
    handleDeleteFieldWithGuard,
    keys: {
      auditSummary: "contacts.setup.auditSummary",
      preferencesSaved: "contacts.setup.preferencesSaved",
      fieldsSaved: "contacts.setup.fieldsSaved",
      saveFailed: "contacts.saveFailed",
      auditChannel: "contacts.setup_audit",
    },
  });

  const handleSave = useCallback(async (): Promise<void> => {
    if (mode === "preferences") {
      await preferencesSave.handleSave();
      return;
    }
    setIsSaving(true);
    try {
      await fieldsSave.handleSave();
    } catch {
      // runModuleFieldsSetupSave already toasts + setSaved(false)
    } finally {
      setIsSaving(false);
    }
  }, [mode, preferencesSave, fieldsSave]);

  return {
    isSaving: isSaving || fieldsSave.saving || preferencesSave.isSaving,
    handleDeleteFieldWithGuard,
    handleDeleteTabWithGuard,
    handleSave,
  };
}
