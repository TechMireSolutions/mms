import type React from "react";
import type { ContactPreferences } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { ContactsPreferencesGeneralSection } from "@/tenant/features/contacts/components/ContactsPreferencesGeneralSection";
import { ContactsPreferencesDuplicateSection } from "@/tenant/features/contacts/components/ContactsPreferencesDuplicateSection";

export interface ContactsPreferencesSectionProps {
  prefs: ContactPreferences;
  isPrefsDirty: boolean;
  countryOptions: Array<{ value: string; label: string }>;
  onUpdatePreference: <K extends keyof ContactPreferences>(
    key: K,
    value: ContactPreferences[K],
  ) => void;
}

/** Stable barrel — Setup Preferences sections for Contacts. */
export function ContactsPreferencesSection({
  prefs,
  isPrefsDirty,
  countryOptions,
  onUpdatePreference,
}: ContactsPreferencesSectionProps): React.JSX.Element {
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

      <ContactsPreferencesDuplicateSection
        prefs={prefs}
        isPrefsDirty={isPrefsDirty}
        onUpdatePreference={onUpdatePreference}
      />
    </>
  );
}
