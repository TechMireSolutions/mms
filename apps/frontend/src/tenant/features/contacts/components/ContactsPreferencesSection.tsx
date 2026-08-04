import type { ContactPreferences } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { ContactsCountryCodesSection } from "@/tenant/features/contacts/components/ContactsCountryCodesSection";
import { ContactsPreferencesGeneralSection } from "@/tenant/features/contacts/components/ContactsPreferencesGeneralSection";
import { ContactsPreferencesDuplicateSection } from "@/tenant/features/contacts/components/ContactsPreferencesDuplicateSection";

export interface ContactsPreferencesSectionProps {
  prefs: ContactPreferences;
  isPrefsDirty: boolean;
  countryOptions: Array<{ value: string; label: string }>;
  countryCodes: Array<{ country: string; code: string }>;
  onUpdatePreference: <K extends keyof ContactPreferences>(
    key: K,
    value: ContactPreferences[K],
  ) => void;
  onUpdateCountryCodes: (countryCodes: Array<{ country: string; code: string }>) => void;
}

/** Stable barrel — Setup Preferences sections for Contacts. */
export function ContactsPreferencesSection({
  prefs,
  isPrefsDirty,
  countryOptions,
  countryCodes,
  onUpdatePreference,
  onUpdateCountryCodes,
}: ContactsPreferencesSectionProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      {isPrefsDirty && (
        <WarningCallout
          role="alert"
          density="banner"
          description={t("contacts.setup.unsavedWarning")}
        />
      )}

      <ContactsPreferencesGeneralSection
        prefs={prefs}
        isPrefsDirty={isPrefsDirty}
        countryOptions={countryOptions}
        onUpdatePreference={onUpdatePreference}
      />

      <ContactsCountryCodesSection
        countryCodes={countryCodes}
        onUpdateCountryCodes={onUpdateCountryCodes}
      />

      <ContactsPreferencesDuplicateSection
        prefs={prefs}
        onUpdatePreference={onUpdatePreference}
      />
    </>
  );
}
