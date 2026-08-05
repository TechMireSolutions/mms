import { Globe, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/SectionCard";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { normalizeDialCode } from "@/lib/contacts/countryCodeOptions";

export interface ContactsCountryCodesSectionProps {
  countryCodes: Array<{ country: string; code: string }>;
  onUpdateCountryCodes: (countryCodes: Array<{ country: string; code: string }>) => void;
}

export function ContactsCountryCodesSection({
  countryCodes,
  onUpdateCountryCodes,
}: ContactsCountryCodesSectionProps): JSX.Element {
  const { t } = useTranslation();

  const updateRow = (index: number, patch: Partial<{ country: string; code: string }>) => {
    onUpdateCountryCodes(
      countryCodes.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const removeRow = (index: number) => {
    onUpdateCountryCodes(countryCodes.filter((_, entryIndex) => entryIndex !== index));
  };

  const addRow = () => {
    onUpdateCountryCodes([...countryCodes, { country: "", code: "" }]);
  };

  return (
    <SectionCard title={t("contacts.setup.countryCodes")} icon={Globe}>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">{t("contacts.setup.countryCodesDesc")}</p>
        <ul className="space-y-2">
          {countryCodes.map((entry, index) => (
            <li
              key={`country-code-${index}`}
              className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
            >
              <div>
                <label className={FORM_LABEL} htmlFor={`country-name-${index}`}>
                  {t("contacts.setup.countryName")}
                </label>
                <Input
                  id={`country-name-${index}`}
                  value={entry.country}
                  onChange={(event) => updateRow(index, { country: event.target.value })}
                  placeholder={t("contacts.setup.countryNamePlaceholder")}
                />
              </div>
              <div>
                <label className={FORM_LABEL} htmlFor={`country-dial-${index}`}>
                  {t("contacts.setup.dialCode")}
                </label>
                <Input
                  id={`country-dial-${index}`}
                  value={entry.code}
                  onChange={(event) => updateRow(index, { code: event.target.value })}
                  onBlur={() => {
                    const normalized = normalizeDialCode(entry.code);
                    if (normalized !== entry.code) updateRow(index, { code: normalized });
                  }}
                  placeholder={t("contacts.setup.dialCodePlaceholder")}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(index)}
                aria-label={t("contacts.setup.removeCountryCode", { index: index + 1 })}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
        <Button type="button" variant="outline" className="min-h-11 gap-2" onClick={addRow}>
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t("contacts.setup.addCountryCode")}
        </Button>
      </div>
    </SectionCard>
  );
}
