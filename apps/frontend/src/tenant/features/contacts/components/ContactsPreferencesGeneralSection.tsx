import { Users } from "lucide-react";
import type { ContactPreferences } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/SectionCard";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";

export function ContactsPreferencesGeneralSection({
  prefs,
  countryOptions,
  onUpdatePreference,
}: {
  prefs: ContactPreferences;
  isPrefsDirty?: boolean;
  countryOptions: Array<{ value: string; label: string }>;
  onUpdatePreference: <K extends keyof ContactPreferences>(
    key: K,
    value: ContactPreferences[K],
  ) => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <SectionCard title={t("contacts.setup.generalPreferences")} icon={Users}>
      <div className="space-y-1">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={FORM_LABEL} htmlFor="defaultCountry">{t("contacts.setup.defaultCountry")}</label>
            <FormSelect
              id="defaultCountry"
              value={prefs.defaultCountry || ""}
              onChange={(val) => onUpdatePreference("defaultCountry", val)}
              options={countryOptions}
              placeholder={t("contacts.setup.defaultCountryPlaceholder")}
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="defaultProvince">{t("contacts.setup.defaultProvince")}</label>
            <Input
              id="defaultProvince"
              value={prefs.defaultProvince || ""}
              onChange={(e) => onUpdatePreference("defaultProvince", e.target.value)}
              placeholder={t("contacts.setup.defaultProvincePlaceholder")}
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="defaultCity">{t("contacts.setup.defaultCity")}</label>
            <Input
              id="defaultCity"
              value={prefs.defaultCity || ""}
              onChange={(e) => onUpdatePreference("defaultCity", e.target.value)}
              placeholder={t("contacts.setup.defaultCityPlaceholder")}
            />
          </div>
        </div>

        <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
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
      </div>
    </SectionCard>
  );
}
