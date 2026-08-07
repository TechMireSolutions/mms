import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  type AppTranslationKey,
  type FieldConfig,
  type ContactPreferences,
  type FieldDefinition,
  type TabDefinition,
  CONFIG_VERSION,
  prepareContactPreferencesSetupSave,
  syncContactColumnRegistryWithFields,
  isContactLockedEnabledTab,
  withContactLockedEnabledTabs,
  type ContactPreferencesSetupIssue,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactMutations } from "@/tenant/features/contacts/hooks/useContacts";
import { notify } from "@/lib/notify";
import { safeAudit } from "@/lib/safeAudit";
import { runModuleFieldsSetupSave } from "@/lib/setup/runModuleFieldsSetupSave";
import type { CountryCodeEntry } from "@/lib/contacts/countryCodeOptions";
import { useContactsSetupFieldDeleteGuard } from "@/tenant/features/contacts/hooks/useContactsSetupFieldDeleteGuard";
import { useContactsSetupTabDeleteGuard } from "@/tenant/features/contacts/hooks/useContactsSetupTabDeleteGuard";
import { syncContactsCustomTabs } from "@/tenant/features/contacts/hooks/syncContactsCustomTabs";

const PREFS_SETUP_ISSUE_KEYS: Record<ContactPreferencesSetupIssue, AppTranslationKey> = {
  invalidProvince: "contacts.setup.invalidProvince",
  invalidCity: "contacts.setup.invalidCity",
  invalidThresholdHigh: "contacts.setup.invalidThresholdHigh",
  invalidThresholdMedium: "contacts.setup.invalidThresholdMedium",
  thresholdOrder: "contacts.setup.thresholdOrder",
  emptyCountryRow: "contacts.setup.emptyCountryRow",
  invalidDialCode: "contacts.setup.invalidDialCode",
  duplicateCountry: "contacts.setup.duplicateCountry",
};

type FieldsEditorLike = {
  formTabs: TabDefinition[];
  enabledTabs: Set<string>;
  tabFields: Record<string, FieldDefinition[]>;
  buildFieldsMap: () => FieldConfig["fields"];
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
      const prepared = prepareContactPreferencesSetupSave(prefs, countryCodesDraft);
      if (!prepared.ok) {
        notify.error(t(PREFS_SETUP_ISSUE_KEYS[prepared.issue]));
        return;
      }

      setIsSaving(true);
      try {
        await updatePrefsAsync(prepared.prefs);
        try {
          await updateCountryCodes(prepared.countryCodes);
        } catch (countryError) {
          // Roll back prefs so Setup does not leave a partial Preferences write.
          await updatePrefsAsync(contextPrefs);
          throw countryError;
        }
        safeAudit(
          logSetupAudit.mutateAsync({
            area: "preferences",
            summary: t("contacts.setup.auditSummary", { area: "preferences" }),
          }),
          "contacts.setup_audit",
        );
        setPrefs(prepared.prefs);
        setCountryCodesDraft(prepared.countryCodes);
        notify.success(t("contacts.setup.preferencesSaved"));
        setSaved(true);
      } catch {
        setSaved(false);
        notify.error(t("contacts.saveFailed"));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setIsSaving(true);
    try {
      const fieldsMap = fieldsEditor.buildFieldsMap() || {};
      const enabledTabIds = withContactLockedEnabledTabs(fieldsEditor.enabledTabs);
      const enabledSet = new Set(enabledTabIds);
      const formTabs = fieldsEditor.formTabs.map((tab) => ({
        ...tab,
        enabled: isContactLockedEnabledTab(tab.key)
          ? true
          : enabledSet.has(tab.key.toLowerCase()),
      }));
      await runModuleFieldsSetupSave({
        formTabs,
        syncCustomTabs: syncContactsCustomTabs,
        persistFieldConfig: async () => {
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
        },
        auditPromise: logSetupAudit.mutateAsync({
          area: "fields",
          summary: t("contacts.setup.auditSummary", { area: "fields" }),
        }),
        auditChannel: "contacts.setup_audit",
        t,
        successKey: "contacts.setup.fieldsSaved",
        failureKey: "contacts.saveFailed",
        setSaved,
      });
    } catch {
      // runModuleFieldsSetupSave already toasts + setSaved(false)
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
    contextPrefs,
    logSetupAudit,
    setPrefs,
    setCountryCodesDraft,
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
