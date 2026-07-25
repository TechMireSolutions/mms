import React from "react";
import { Phone, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EditableSelect, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { ListFieldCard, EmptyListCard } from "./FormCardUtils";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Contact,
  PhoneNumber,
  DEFAULT_PHONE_LABELS,
  parsePhoneNumber,
} from "@mms/shared";

export interface ContactPhonesTabProps {
  contactDraft: Partial<Contact>;
  getLocalId: (tabName: string, idx: number) => string;
  phoneLabels: string[];
  defaultCountryCode: string;
  countryCodeOptions: string[];
  getListItemError: (tabId: string, fieldId: string, index: number) => string | undefined;
  addSubListItem: <K extends "phones" | "emails" | "addresses" | "socials" | "emergencyContacts">(
    fieldKey: K,
    newItem: NonNullable<Contact[K]>[number]
  ) => void;
  updateSubListItem: <K extends "phones" | "emails" | "addresses" | "socials" | "emergencyContacts">(
    fieldKey: K,
    idx: number,
    patch: Partial<NonNullable<Contact[K]>[number]>
  ) => void;
  removeSubListItem: (fieldKey: "phones" | "emails" | "addresses" | "socials" | "emergencyContacts", idx: number) => void;
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
  updateSubListItem,
  removeSubListItem,
  handlePhoneBlur,
}: ContactPhonesTabProps): JSX.Element {
  const { t } = useTranslation();
  const phones = contactDraft.phones || [];
  const addPhone = () => {
    addSubListItem("phones", { label: phoneLabels[0] || "Mobile", number: "", countryCode: defaultCountryCode });
  };
  const removePhone = (idx: number) => removeSubListItem("phones", idx);
  const updatePhone = (idx: number, patch: Partial<PhoneNumber>) => updateSubListItem("phones", idx, patch);

  return (
    <div className="space-y-3 text-left">
      {phones.length === 0 && (
        <EmptyListCard icon={Phone} message={t("contacts.form.noPhoneNumbersYet")} />
      )}

      <div className="space-y-3">
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
                    value={phone.label || "Mobile"}
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
                    className="w-[90px] shrink-0"
                    id={`phone-country-${idx}`}
                    name={`phone-country-${idx}`}
                  />
                  <div className="relative flex items-center group/input flex-1 min-w-0">
                    <Phone className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
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
                        "pl-10",
                        numError &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                </div>
                {numError && (
                  <p className="text-[10px] text-destructive mt-1 font-medium">
                    {numError}
                  </p>
                )}
              </ListFieldCard>
            );
          })}
        </AnimatePresence>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={addPhone}
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start mt-2 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addPhoneNumber")}</span>
      </Button>
    </div>
  );
}
