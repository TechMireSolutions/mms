import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import type { ContactPreferences } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";

export function ContactsPreferencesGeneralSection({
  prefs,
  isPrefsDirty,
  countryOptions,
  onUpdatePreference,
}: {
  prefs: ContactPreferences;
  isPrefsDirty: boolean;
  countryOptions: Array<{ value: string; label: string }>;
  onUpdatePreference: <K extends keyof ContactPreferences>(
    key: K,
    value: ContactPreferences[K],
  ) => void;
}): JSX.Element {
  const { t } = useTranslation();
  const [namePrefixesDraft, setNamePrefixesDraft] = useState(
    () => (prefs.namePrefixesToIgnore ?? []).join(", "),
  );

  useEffect(() => {
    if (isPrefsDirty) return;
    setNamePrefixesDraft((prefs.namePrefixesToIgnore ?? []).join(", "));
  }, [prefs.namePrefixesToIgnore, isPrefsDirty]);

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">{t("contacts.setup.generalPreferences")}</span>
      </div>
      <div className="p-4 space-y-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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

        <div className="border-t border-border/60 pt-3 mt-3 space-y-2">
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

        <div className="border-t border-border/60 pt-3 mt-3">
          <label className={FORM_LABEL} htmlFor="namePrefixesToIgnore">
            {t("contacts.setup.namePrefixesToIgnore")}
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            {t("contacts.setup.namePrefixesToIgnoreDesc")}
          </p>
          <Input
            id="namePrefixesToIgnore"
            value={namePrefixesDraft}
            onChange={(e) => {
              const raw = e.target.value;
              setNamePrefixesDraft(raw);
              const next = raw
                .split(",")
                .map((prefix) => prefix.trim())
                .filter(Boolean);
              onUpdatePreference("namePrefixesToIgnore", next);
            }}
            placeholder={t("contacts.setup.namePrefixesToIgnorePlaceholder")}
          />
        </div>
      </div>
    </section>
  );
}
