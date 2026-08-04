import React, { useEffect } from "react";
import { Save } from "lucide-react";
import {
  FieldConfig,
  isContactLockedEnabledTab,
  isContactSeedFormTab,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { WarningCallout } from "@/components/ui/WarningCallout";
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

  return (
    <div className="space-y-6 max-w-3xl text-start">
      {showFields && isFieldsDirty && (
        <WarningCallout
          role="alert"
          density="banner"
          description={t("contacts.setup.unsavedFieldsWarning")}
        />
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={wrappedFieldsEditor}
          isCoreField={isCoreField}
          isProtectedTab={isContactSeedFormTab}
          isLockedTab={isContactLockedEnabledTab}
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
      <div className="flex items-center gap-3 pt-2 border-t border-border sticky bottom-0 bg-background pb-2 flex-wrap">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || (showPrefs ? !isPrefsDirty : !isFieldsDirty)}
          className="flex items-center gap-2 px-5 min-h-11"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>{saved ? t("contacts.form.saved") : t("contacts.setup.saveAndApply")}</span>
        </Button>
      </div>
    </div>
  );
}
