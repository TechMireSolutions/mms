import type React from "react";
import { Users } from "lucide-react";
import type { ContactPreferences } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { SectionCard } from "@/components/ui/SectionCard";
import { ToggleRow } from "@/components/ui/ToggleRow";

export interface ContactsPreferencesGeneralSectionProps {
  prefs: ContactPreferences;
  isPrefsDirty?: boolean;
  countryOptions?: Array<{ value: string; label: string }>;
  onUpdatePreference: <K extends keyof ContactPreferences>(
    key: K,
    value: ContactPreferences[K],
  ) => void;
}

export function ContactsPreferencesGeneralSection({
  prefs,
  onUpdatePreference,
}: ContactsPreferencesGeneralSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <SectionCard title={t("contacts.setup.generalPreferences")} icon={Users} headingLevel={2}>
      <div className="space-y-2">
        <ToggleRow
          label={t("contacts.setup.showDetailedSolarAge")}
          description={t("contacts.setup.showDetailedSolarAgeDesc")}
          value={!!prefs.showDetailedSolarAge}
          onChange={(val) => onUpdatePreference("showDetailedSolarAge", val)}
        />
        <ToggleRow
          label={t("contacts.setup.showLunarDob")}
          description={t("contacts.setup.showLunarDobDesc")}
          value={!!prefs.showLunarDob}
          onChange={(val) => onUpdatePreference("showLunarDob", val)}
        />
        <ToggleRow
          label={t("contacts.setup.showDetailedLunarAge")}
          description={t("contacts.setup.showDetailedLunarAgeDesc")}
          value={!!prefs.showDetailedLunarAge}
          onChange={(val) => onUpdatePreference("showDetailedLunarAge", val)}
        />
      </div>
    </SectionCard>
  );
}
