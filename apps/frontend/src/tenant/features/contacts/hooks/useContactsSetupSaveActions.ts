import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import {
  type FieldConfig,
  type ContactPreferences,
  type TabDefinition,
  CONFIG_VERSION,
  toTitleCase,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactMutations } from "@/tenant/features/contacts/hooks/useContacts";
import { notify } from "@/lib/notify";
import { useContactsSetupFieldDeleteGuard } from "@/tenant/features/contacts/hooks/useContactsSetupFieldDeleteGuard";

type FieldsEditorLike = {
  formTabs: TabDefinition[];
  handleDeleteField: (tabId: string, fieldId: string) => void;
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
  setSaved: Dispatch<SetStateAction<boolean>>;
}) {
  const { t } = useTranslation();
  const { logSetupAudit } = useContactMutations();
  const [isSaving, setIsSaving] = useState(false);

  const handleDeleteFieldWithGuard = useContactsSetupFieldDeleteGuard({
    config,
    contextPrefs,
    onDeleteField: fieldsEditor.handleDeleteField,
    onDirty: () => setSaved(false),
  });

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

      const updatedPrefs = {
        ...prefs,
        defaultCountry: prefs.defaultCountry ? toTitleCase(prefs.defaultCountry.trim()) : "",
        defaultProvince: prefs.defaultProvince ? toTitleCase(prefs.defaultProvince.trim()) : "",
        defaultCity: prefs.defaultCity ? toTitleCase(prefs.defaultCity.trim()) : "",
      };

      if (mode === "preferences") {
        await updatePrefsAsync(updatedPrefs);
        await logSetupAudit.mutateAsync({
          area: "preferences",
          summary: t("contacts.setup.auditSummary", { area: "preferences" }),
        });
        setPrefs(updatedPrefs);
      } else {
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
        await logSetupAudit.mutateAsync({
          area: "fields",
          summary: t("contacts.setup.auditSummary", { area: "fields" }),
        });
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
    fieldsEditor.formTabs,
    mode,
    saveSettingsAsync,
    updatePrefsAsync,
    logSetupAudit,
    setPrefs,
    setSaved,
    t,
  ]);

  return {
    isSaving,
    handleDeleteFieldWithGuard,
    handleSave,
  };
}
