import React from "react";
import { Phone } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { EditableSelect, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { ListFieldCard, ContactSubListShell, FieldInlineError } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { resolvePhoneLabel } from "@/lib/contacts/contactI18n";
import {
  PhoneNumber,
  DEFAULT_PHONE_LABELS,
  parsePhoneNumber,
} from "@mms/shared";

export interface ContactPhonesTabProps extends ContactSubListTabBaseProps {
  phoneLabels: string[];
  defaultCountryCode: string;
  countryCodeOptions: string[];
  handlePhoneBlur: (index: number) => void;
}

export function ContactPhonesTab({
  contactDraft,
  getLocalId,
  phoneLabels,
  defaultCountryCode,
  countryCodeOptions,
  getListItemError,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
  handlePhoneBlur,
}: ContactPhonesTabProps): JSX.Element {
  const { t } = useTranslation();
  const phones = contactDraft.phones || [];
  const emptyPhone = () => ({
    label: resolvePhoneLabel(undefined, phoneLabels, t),
    number: "",
    countryCode: defaultCountryCode,
  });
  const addPhone = () => {
    addSubListItem("phones", emptyPhone());
  };
  const ensurePhone = () => {
    ensureSubListItem("phones", emptyPhone());
  };
  const removePhone = (idx: number) => removeSubListItem("phones", idx);
  const updatePhone = (idx: number, patch: Partial<PhoneNumber>) => updateSubListItem("phones", idx, patch);

  return (
    <ContactSubListShell
      isEmpty={phones.length === 0}
      emptyIcon={Phone}
      emptyMessage={t("contacts.form.noPhoneNumbersYet")}
      addLabel={t("contacts.form.addPhoneNumber")}
      onAdd={addPhone}
      onEnsureRow={ensurePhone}
    >
      <AnimatePresence initial={false}>
        {phones.map((phone, idx) => {
          const numError = getListItemError("phones", "number", idx);
          return (
            <ListFieldCard
              key={getLocalId("phones", idx)}
              id={getLocalId("phones", idx)}
              index={idx}
              icon={Phone}
              accentClass="bg-primary/60 group-hover:bg-primary"
              iconClass="text-primary/70 group-hover:text-primary"
              label={`${t("contacts.form.type")}:`}
              typeSelect={
                <EditableSelect
                  options={
                    phoneLabels.length > 0
                      ? phoneLabels
                      : (DEFAULT_PHONE_LABELS as unknown as string[])
                  }
                  value={resolvePhoneLabel(phone.label, phoneLabels, t)}
                  onChange={(val) => updatePhone(idx, { label: val })}
                  className={TYPE_SELECT_WIDTH}
                  id={`phone-label-${idx}`}
                  name={`phone-label-${idx}`}
                />
              }
              onRemove={() => removePhone(idx)}
              removeLabel={t("contacts.form.removePhoneNumber", { index: idx + 1 })}
            >
              <div className="flex items-center gap-2 w-full">
                <EditableSelect
                  options={countryCodeOptions}
                  value={phone.countryCode || defaultCountryCode}
                  onChange={(val) => updatePhone(idx, { countryCode: val })}
                  className="w-[5.625rem] shrink-0"
                  id={`phone-country-${idx}`}
                  name={`phone-country-${idx}`}
                />
                <div className="relative flex items-center group/input flex-1 min-w-0">
                  <Phone className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    type="tel"
                    id={`phone-number-${idx}`}
                    name={`phone-number-${idx}`}
                    value={phone.number || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const trimmed = val.trim();
                      if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
                        const parsed = parsePhoneNumber(val, phone.countryCode || defaultCountryCode, countryCodeOptions);
                        updatePhone(idx, {
                          countryCode: parsed.countryCode,
                          number: parsed.number,
                        });
                        return;
                      }
                      updatePhone(idx, { number: val });
                    }}
                    onBlur={() => handlePhoneBlur(idx)}
                    placeholder={t("contacts.form.phoneNumberPlaceholder")}
                    className={cn(
                      "ps-10",
                      numError &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                </div>
              </div>
              <FieldInlineError message={numError} />
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
