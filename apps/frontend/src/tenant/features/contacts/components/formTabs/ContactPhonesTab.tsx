import type React from "react";
import { Phone, Star } from "lucide-react";
import { EditableSelect } from "@/components/ui/FormPrimitives";
import type { ContactSubListTabBaseProps } from "./types";
import { useTranslation } from "@/hooks/useTranslation";
import { resolvePhoneLabel } from "@/lib/contacts/contactI18n";
import { SUB_LIST_CARD_ACCENTS } from "@/lib/semanticTone";
import { parsePhoneNumber } from "@mms/shared";
import { cn } from "@/lib/utils";
import { ContactLabeledValueSubListTab } from "./ContactLabeledValueSubListTab";

export interface ContactPhonesTabProps extends ContactSubListTabBaseProps {
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
}: ContactPhonesTabProps): React.JSX.Element {
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
      valueLabel={t("contacts.fields.phoneNumber")}
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
      accentClass={SUB_LIST_CARD_ACCENTS.phones.accent}
      iconClass={SUB_LIST_CARD_ACCENTS.phones.icon}
      emptyMessage={t("contacts.form.noPhoneNumbersYet")}
      addLabel={t("contacts.form.addPhoneNumber")}
      removeLabel={(index) => t("contacts.form.removePhoneNumber", { index })}
      valuePlaceholder={t("contacts.form.phoneNumberPlaceholder")}
      valueInputType="tel"
      valueInputIdPrefix={`cf-${base.formInstanceId}-phone-number`}
      labelSelectIdPrefix={`cf-${base.formInstanceId}-phone-label`}
      autoComplete="tel-national"
      inputMode="tel"
      enterKeyHint="next"
      spellCheck={false}
      onValueBlur={handlePhoneBlur}
      headerExtras={({ item, index }) => {
        const phones = base.contactDraft.phones || [];
        if (phones.length <= 1) return null;
        const hasExplicitPrimary = phones.some((p) => p.isPrimary);
        const isPrimary = Boolean(item.isPrimary || (!hasExplicitPrimary && index === 0));
        return (
          <button
            type="button"
            onClick={() => base.setPrimarySubListItem?.("phones", index)}
            className={cn(
              "cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-2xs font-semibold transition-colors min-h-[32px] touch-manipulation select-none",
              isPrimary
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 border border-transparent",
            )}
            title={isPrimary ? t("contacts.form.primaryPhone") : t("contacts.form.setPrimary")}
            aria-label={isPrimary ? t("contacts.form.primaryPhone") : t("contacts.form.setPrimary")}
          >
            <Star className={cn("w-3 h-3", isPrimary && "fill-primary text-primary")} aria-hidden />
            <span>{isPrimary ? t("contacts.form.primary") : t("contacts.form.setPrimary")}</span>
          </button>
        );
      }}
      valueLeadingAddon={({ item, index, updateItem }) => (
        <EditableSelect
          options={countryCodeOptions}
          value={resolveDialCode(item)}
          onChange={(val) => updateItem(index, { countryCode: val })}
          onUpdateOptions={onUpdateDialCodeOptions}
          className="w-phone-prefix shrink-0"
          id={`cf-${base.formInstanceId}-phone-country-${index}`}
          name={`cf-${base.formInstanceId}-phone-country-${index}`}
          aria-label={t("contacts.form.dialCode")}
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
