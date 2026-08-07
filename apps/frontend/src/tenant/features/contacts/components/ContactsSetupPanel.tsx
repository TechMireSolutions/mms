import React, { useEffect } from "react";
import {
  FieldConfig,
  isContactLockedEnabledTab,
  isContactLockedField,
  isContactSeedFormTab,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { ContactsPreferencesSection } from "@/tenant/features/contacts/components/ContactsPreferencesSection";
import { useContactsSetupPanelState } from "@/tenant/features/contacts/hooks/useContactsSetupPanelState";

interface ContactsSetupPanelProps {
  config: FieldConfig;
  onConfigChange: (config: FieldConfig) => void;
  onConfigChangeAsync?: (config: FieldConfig) => Promise<void>;
  mode?: "fields" | "preferences";
  /** Reports Fields draft dirtiness to the Setup shell (leave-guard). */
  onFieldsDirtyChange?: (isDirty: boolean) => void;
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export default function ContactsSetupPanel({
  config,
  onConfigChange,
  onConfigChangeAsync,
  mode,
  onFieldsDirtyChange,
  onPrefsDirtyChange,
}: ContactsSetupPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const {
    saved,
    setSaved,
    prefs,
    isSaving,
    isPrefsDirty,
    isFieldsDirty,
    countryOptions,
    countryCodes,
    updateCountryCodes,
    updatePreference,
    wrappedFieldsEditor,
    handleSave,
    isCoreField,
    showFields,
    showPrefs,
  } = useContactsSetupPanelState({
    config,
    onConfigChange,
    onConfigChangeAsync,
    mode,
  });

  useEffect(() => {
    if (!showFields) {
      onFieldsDirtyChange?.(false);
      return;
    }
    onFieldsDirtyChange?.(isFieldsDirty);
  }, [showFields, isFieldsDirty, onFieldsDirtyChange]);

  useEffect(() => {
    if (!showPrefs) {
      onPrefsDirtyChange?.(false);
      return;
    }
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [showPrefs, isPrefsDirty, onPrefsDirtyChange]);

  const isDirty = showPrefs ? isPrefsDirty : isFieldsDirty;
  // Prefs warning lives in ContactsPreferencesSection; Fields uses the shared footer.
  const unsavedWarning = showFields ? t("contacts.setup.unsavedFieldsWarning") : undefined;

  return (
    <div className="space-y-6 max-w-3xl text-start">
      {showFields && (
        <ModuleFieldsSetup
          editor={wrappedFieldsEditor}
          isCoreField={isCoreField}
          isProtectedTab={isContactSeedFormTab}
          isLockedTab={isContactLockedEnabledTab}
          isLockedField={isContactLockedField}
          onStateChange={() => setSaved(false)}
          copy={{
            introTitle: t("contacts.setup.fieldsIntroTitle"),
            introDescription: t("contacts.setup.fieldsIntroDescription"),
            customTabDescription: t("contacts.setup.customTabDescription"),
          }}
        />
      )}

      {showPrefs && (
        <ContactsPreferencesSection
          prefs={prefs}
          isPrefsDirty={isPrefsDirty}
          countryOptions={countryOptions}
          countryCodes={countryCodes}
          onUpdatePreference={updatePreference}
          onUpdateCountryCodes={updateCountryCodes}
        />
      )}

      {/* Explicit Save (not auto-save): intentional for Contacts Setup Fields audit + column sync. */}
      <ModuleSetupSaveFooter
        dirty={isDirty}
        saving={isSaving}
        saved={saved}
        unsavedWarning={unsavedWarning}
        saveLabel={isSaving ? t("global.saving") : t("contacts.setup.saveAndApply")}
        savedLabel={t("contacts.form.saved")}
        onSave={handleSave}
        footerClassName="sticky bottom-0 bg-background mt-0 pt-2 pb-2 justify-start border-border flex-wrap gap-3"
        buttonClassName="flex items-center gap-2 px-5 min-h-11 ms-0"
      />
    </div>
  );
}
