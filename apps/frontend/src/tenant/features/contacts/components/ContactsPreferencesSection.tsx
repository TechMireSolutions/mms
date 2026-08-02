import { AlertTriangle, Users, Copy } from "lucide-react";
import type { ContactPreferences } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Checkbox } from "@/components/ui/checkbox";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { ContactsCountryCodesSection } from "@/tenant/features/contacts/components/ContactsCountryCodesSection";
import { ContactsRelationshipPairsSection } from "@/tenant/features/contacts/components/ContactsRelationshipPairsSection";


const DUPLICATE_DETECTION_FIELD_OPTIONS = [
  { id: "name", labelKey: "contacts.setup.duplicateFieldName" as const },
  { id: "phone", labelKey: "contacts.setup.duplicateFieldPhone" as const },
  { id: "email", labelKey: "contacts.setup.duplicateFieldEmail" as const },
] as const;

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

export function ContactsPreferencesSection({
  prefs,
  isPrefsDirty,
  countryOptions,
  countryCodes,
  onUpdatePreference,
  onUpdateCountryCodes,
}: ContactsPreferencesSectionProps): JSX.Element {
  const { t } = useTranslation();
  const detectionFields = prefs.duplicateDetectionFields ?? ["name", "phone", "email"];

  const toggleDetectionField = (fieldId: string, enabled: boolean) => {

    const next = enabled
      ? Array.from(new Set([...detectionFields, fieldId]))
      : detectionFields.filter((field) => field !== fieldId);
    onUpdatePreference("duplicateDetectionFields", next.length > 0 ? next : ["name"]);
  };

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
        </div>
      </section>

      <ContactsCountryCodesSection
        countryCodes={countryCodes}
        onUpdateCountryCodes={onUpdateCountryCodes}
      />

      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
          <Copy className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">{t("contacts.setup.duplicateDetection")}</span>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">{t("contacts.setup.duplicateDetectionDesc")}</p>
          <fieldset className="space-y-2">
            <legend className={FORM_LABEL}>{t("contacts.setup.duplicateFields")}</legend>
            <div className="flex flex-wrap gap-3">
              {DUPLICATE_DETECTION_FIELD_OPTIONS.map((option) => {
                const checked = detectionFields.includes(option.id);
                const checkboxId = `dup-field-${option.id}`;
                return (
                  <label
                    key={option.id}
                    htmlFor={checkboxId}
                    className="flex min-h-11 items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={checked}
                      onCheckedChange={(value) => toggleDetectionField(option.id, value === true)}
                    />
                    <span>{t(option.labelKey)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={FORM_LABEL} htmlFor="dupThresholdHigh">
                {t("contacts.setup.duplicateThresholdHigh")}
              </label>
              <Input
                id="dupThresholdHigh"
                type="number"
                min={1}
                max={100}
                value={prefs.duplicateDetectionThresholdHigh ?? 90}
                onChange={(e) =>
                  onUpdatePreference("duplicateDetectionThresholdHigh", Number(e.target.value) || 90)
                }
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="dupThresholdMedium">
                {t("contacts.setup.duplicateThresholdMedium")}
              </label>
              <Input
                id="dupThresholdMedium"
                type="number"
                min={1}
                max={100}
                value={prefs.duplicateDetectionThresholdMedium ?? 75}
                onChange={(e) =>
                  onUpdatePreference("duplicateDetectionThresholdMedium", Number(e.target.value) || 75)
                }
              />
            </div>
          </div>
        </div>
      </section>

      <ContactsRelationshipPairsSection
        pairs={prefs.relationshipPairs ?? []}
        onUpdatePairs={(pairs) => onUpdatePreference("relationshipPairs", pairs)}
      />
    </>
  );
}

