import { Phone } from "lucide-react";
import { EditableSelect } from "@/components/ui/FormPrimitives";
import type { ContactSubListTabBaseProps } from "./types";
import { useTranslation } from "@/hooks/useTranslation";
import { resolvePhoneLabel } from "@/lib/contacts/contactI18n";
import { parsePhoneNumber } from "@mms/shared";
import { ContactLabeledValueSubListTab } from "./ContactLabeledValueSubListTab";

interface ContactPhonesTabProps extends ContactSubListTabBaseProps {
  phoneLabels: string[];
  onUpdatePhoneLabels: (labels: string[]) => void;
  defaultCountryCode: string;
  countryCodeOptions: string[];
  onUpdateDialCodeOptions: (codes: string[]) => void;
  handlePhoneBlur: (index: number) => void;
}

export function ContactPhonesTab({
  phoneLabels,
  onUpdatePhoneLabels,
  defaultCountryCode,
  countryCodeOptions,
  onUpdateDialCodeOptions,
  handlePhoneBlur,
  ...base
}: ContactPhonesTabProps): JSX.Element {
  const { t } = useTranslation();

  const resolveDialCode = (item: Record<string, unknown>): string =>
    typeof item.countryCode === "string" && item.countryCode
      ? item.countryCode
      : defaultCountryCode;

  return (
    <ContactLabeledValueSubListTab
      {...base}
      listKey="phones"
      labelFieldKey="label"
      valueFieldKey="number"
      options={phoneLabels}
      onUpdateOptions={onUpdatePhoneLabels}
      resolveLabel={(raw, options, translate) =>
        resolvePhoneLabel(raw as string | undefined, options, translate)
      }
      emptyItem={(resolvedLabel) => ({
        label: resolvedLabel,
        number: "",
        countryCode: defaultCountryCode,
      })}
      icon={Phone}
      accentClass="bg-primary/60 group-hover:bg-primary"
      iconClass="text-primary/70 group-hover:text-primary"
      emptyMessage={t("contacts.form.noPhoneNumbersYet")}
      addLabel={t("contacts.form.addPhoneNumber")}
      removeLabel={(index) => t("contacts.form.removePhoneNumber", { index })}
      valuePlaceholder={t("contacts.form.phoneNumberPlaceholder")}
      valueInputType="tel"
      valueInputIdPrefix="phone-number"
      labelSelectIdPrefix="phone-label"
      onValueBlur={handlePhoneBlur}
      valueLeadingAddon={({ item, index, updateItem }) => (
        <EditableSelect
          options={countryCodeOptions}
          value={resolveDialCode(item)}
          onChange={(val) => updateItem(index, { countryCode: val })}
          onUpdateOptions={onUpdateDialCodeOptions}
          className="w-[5.625rem] shrink-0"
          id={`phone-country-${index}`}
          name={`phone-country-${index}`}
        />
      )}
      onValueChange={({ value, item, index, updateItem }) => {
        const countryCode = resolveDialCode(item);
        const trimmed = value.trim();
        if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
          const parsed = parsePhoneNumber(value, countryCode, countryCodeOptions);
          updateItem(index, {
            countryCode: parsed.countryCode,
            number: parsed.number,
          });
          return;
        }
        updateItem(index, { number: value });
      }}
    />
  );
}
