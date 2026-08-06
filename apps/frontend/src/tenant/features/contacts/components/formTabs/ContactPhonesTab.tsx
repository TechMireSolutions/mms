import React from "react";
import { Phone } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { EditableSelect, FieldErrorMessage, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { ListFieldCard, ContactSubListShell } from "./ContactSubListCards";
import {
  ContactSubListCustomFields,
  withSubListCustomFieldDefaults,
} from "./ContactSubListCustomFields";
import type { ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { resolvePhoneLabel } from "@/lib/contacts/contactI18n";
import { listEnabledCustomContactFormFields, PhoneNumber, parsePhoneNumber } from "@mms/shared";

export interface ContactPhonesTabProps extends ContactSubListTabBaseProps {
  phoneLabels: string[];
  onUpdatePhoneLabels: (labels: string[]) => void;
  defaultCountryCode: string;
  countryCodeOptions: string[];
  onUpdateDialCodeOptions: (codes: string[]) => void;
  handlePhoneBlur: (index: number) => void;
}

export function ContactPhonesTab({
  contactDraft,
  getLocalId,
  phoneLabels,
  onUpdatePhoneLabels,
  defaultCountryCode,
  countryCodeOptions,
  onUpdateDialCodeOptions,
  getListItemError,
  isFieldEnabled,
  isFieldRequired,
  fields,
  formInstanceId,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
  handlePhoneBlur,
}: ContactPhonesTabProps): JSX.Element {
  const { t } = useTranslation();
  const showLabel = isFieldEnabled("phones", "label");
  const showNumber = isFieldEnabled("phones", "number");
  const customFields = listEnabledCustomContactFormFields(fields, "phones");
  const allowAdd = showLabel || showNumber || customFields.length > 0;
  const phones = contactDraft.phones || [];
  const emptyPhone = () =>
    withSubListCustomFieldDefaults(
      {
        label: resolvePhoneLabel(undefined, phoneLabels, t),
        number: "",
        countryCode: defaultCountryCode,
      },
      fields,
      "phones",
    );
  const addPhone = () => {
    addSubListItem("phones", emptyPhone());
  };
  const ensurePhone = () => {
    ensureSubListItem("phones", emptyPhone());
  };
  const removePhone = (idx: number) => removeSubListItem("phones", idx);
  const updatePhone = (idx: number, patch: Partial<PhoneNumber> & Record<string, unknown>) =>
    updateSubListItem("phones", idx, patch);

  return (
    <ContactSubListShell
      isEmpty={phones.length === 0}
      emptyIcon={Phone}
      emptyMessage={t("contacts.form.noPhoneNumbersYet")}
      addLabel={t("contacts.form.addPhoneNumber")}
      onAdd={addPhone}
      onEnsureRow={ensurePhone}
      allowAdd={allowAdd}
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
                showLabel ? (
                  <EditableSelect
                    options={phoneLabels}
                    value={resolvePhoneLabel(phone.label, phoneLabels, t)}
                    onChange={(val) => updatePhone(idx, { label: val })}
                    onUpdateOptions={onUpdatePhoneLabels}
                    className={TYPE_SELECT_WIDTH}
                    id={`phone-label-${idx}`}
                    name={`phone-label-${idx}`}
                  />
                ) : undefined
              }
              onRemove={() => removePhone(idx)}
              removeLabel={t("contacts.form.removePhoneNumber", { index: idx + 1 })}
            >
              <div className="space-y-3">
                {showNumber ? (
                  <>
                    <div className="flex w-full items-center gap-2">
                      <EditableSelect
                        options={countryCodeOptions}
                        value={phone.countryCode || defaultCountryCode}
                        onChange={(val) => updatePhone(idx, { countryCode: val })}
                        onUpdateOptions={onUpdateDialCodeOptions}
                        className="w-[5.625rem] shrink-0"
                        id={`phone-country-${idx}`}
                        name={`phone-country-${idx}`}
                      />
                      <div className="group/input relative flex min-w-0 flex-1 items-center">
                        <Phone className="pointer-events-none absolute start-3.5 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within/input:text-primary" />
                        <Input
                          type="tel"
                          id={`phone-number-${idx}`}
                          name={`phone-number-${idx}`}
                          value={phone.number || ""}
                          required={isFieldRequired("phones", "number")}
                          onChange={(e) => {
                            const val = e.target.value;
                            const trimmed = val.trim();
                            if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
                              const parsed = parsePhoneNumber(
                                val,
                                phone.countryCode || defaultCountryCode,
                                countryCodeOptions,
                              );
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
                            numError && "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                      </div>
                    </div>
                    <FieldErrorMessage message={numError} />
                  </>
                ) : null}
                <ContactSubListCustomFields
                  tabId="phones"
                  fields={fields}
                  formInstanceId={formInstanceId}
                  rowIndex={idx}
                  row={phone}
                  getListItemError={getListItemError}
                  onPatch={(patch) => updatePhone(idx, patch)}
                />
              </div>
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
