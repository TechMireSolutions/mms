import { AlertTriangle } from "lucide-react";
import type { ContactPreferences } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
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
        <div
          className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t("contacts.setup.unsavedWarning")}</span>
        </div>
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
