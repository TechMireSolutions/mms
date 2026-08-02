import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  type FieldConfig,
  type ContactPreferences,
  type FieldDefinition,
  type TabDefinition,
  CONFIG_VERSION,
  normalizeContactPreferences,
  syncContactColumnRegistryWithFields,
  toTitleCase,
  withContactLockedEnabledTabs,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactMutations } from "@/tenant/features/contacts/hooks/useContacts";
import { notify } from "@/lib/notify";
import { useContactsSetupFieldDeleteGuard } from "@/tenant/features/contacts/hooks/useContactsSetupFieldDeleteGuard";
import { useContactsSetupTabDeleteGuard } from "@/tenant/features/contacts/hooks/useContactsSetupTabDeleteGuard";

type FieldsEditorLike = {
  formTabs: TabDefinition[];
  enabledTabs: Set<string>;
  tabFields: Record<string, FieldDefinition[]>;
  buildFieldsMap: () => FieldConfig["fields"];
  handleDeleteField: (tabId: string, fieldId: string) => void;
  handleDeleteTab: (tabId: string) => void;
};

type CountryCodeEntry = { country: string; code: string };

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
  setSaved: Dispatch<SetStateAction<boolean>>;
}) {
  const { t } = useTranslation();
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

  const handleSave = useCallback(async (): Promise<void> => {
    if (mode === "preferences") {
      if (prefs.defaultProvince && /\d/.test(prefs.defaultProvince)) {
        notify.error(t("contacts.setup.invalidProvince"));
        return;
      }
      if (prefs.defaultCity && /\d/.test(prefs.defaultCity)) {
        notify.error(t("contacts.setup.invalidCity"));
        return;
      }
    }

    setIsSaving(true);
    try {
      const updatedPrefs = normalizeContactPreferences({
        ...prefs,
        defaultCountry: prefs.defaultCountry ? toTitleCase(prefs.defaultCountry.trim()) : "",
        defaultProvince: prefs.defaultProvince ? toTitleCase(prefs.defaultProvince.trim()) : "",
        defaultCity: prefs.defaultCity ? toTitleCase(prefs.defaultCity.trim()) : "",
      });

      if (mode === "preferences") {
        await updatePrefsAsync(updatedPrefs);
        await updateCountryCodes(countryCodesDraft);
        await logSetupAudit.mutateAsync({
          area: "preferences",
          summary: t("contacts.setup.auditSummary", { area: "preferences" }),
        });
        setPrefs(updatedPrefs);
        notify.success(t("contacts.setup.preferencesSaved"));
      } else {
        const fieldsMap = fieldsEditor.buildFieldsMap() || {};
        const enabledTabIds = withContactLockedEnabledTabs(fieldsEditor.enabledTabs);
        // Omit formTabs/enabledTabs — saveSettingsAsync syncs them from the fields editor.
        await saveSettingsAsync(
          {},
          {
            version: CONFIG_VERSION,
            pageTabs: config.pageTabs || [],
            detailTabs: (config.detailTabs || []).filter((tab) => tab.key !== "network"),
            settingsSubTabs: config.settingsSubTabs || [],
            columnRegistry: syncContactColumnRegistryWithFields(
              config.columnRegistry,
              fieldsMap,
              enabledTabIds,
            ),
          },
          { markSaved: false },
        );
        await logSetupAudit.mutateAsync({
          area: "fields",
          summary: t("contacts.setup.auditSummary", { area: "fields" }),
        });
        notify.success(t("contacts.setup.fieldsSaved"));
      }

      setSaved(true);
    } catch {
      setSaved(false);
      notify.error(t("contacts.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }, [
    prefs,
    config,
    mode,
    fieldsEditor,
    saveSettingsAsync,
    updatePrefsAsync,
    updateCountryCodes,
    countryCodesDraft,
    logSetupAudit,
    setPrefs,
    setSaved,
    t,
  ]);

  return {
    isSaving,
    handleDeleteFieldWithGuard,
    handleDeleteTabWithGuard,
    handleSave,
  };
}
