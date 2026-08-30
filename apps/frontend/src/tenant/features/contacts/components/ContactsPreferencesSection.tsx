import type React from "react";
import type { ContactPreferences } from "@mms/shared";
import { ContactsPreferencesGeneralSection } from "@/tenant/features/contacts/components/ContactsPreferencesGeneralSection";
import { ContactsPreferencesDuplicateSection } from "@/tenant/features/contacts/components/ContactsPreferencesDuplicateSection";

export interface ContactsPreferencesSectionProps {
  prefs: ContactPreferences;
  isPrefsDirty: boolean;
  onUpdatePreference: <K extends keyof ContactPreferences>(
    key: K,
    value: ContactPreferences[K],
  ) => void;
}

/** Stable barrel — Setup Preferences sections for Contacts. */
export function ContactsPreferencesSection({
  prefs,
  isPrefsDirty,
  onUpdatePreference,
}: ContactsPreferencesSectionProps): React.JSX.Element {
  return (
    <>
      <ContactsPreferencesGeneralSection
        prefs={prefs}
        isPrefsDirty={isPrefsDirty}
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
